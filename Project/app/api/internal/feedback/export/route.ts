import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { hasPermission } from '@/lib/auth/permissions';
import { buildFeedbackWhere, VENUE_LABELS, STATUS_LABELS } from '@/lib/feedback';
import { formatDateTimeVN, formatIsoDateVN } from '@/lib/locale';

/** Neutralise spreadsheet formula injection and quote for CSV. */
function csv(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const g = await apiGuard('feedback.export');
  if (g.error) return g.error;
  const { user } = g;

  const sp = new URL(request.url).searchParams;
  const where = buildFeedbackWhere(user, {
    status: sp.get('status') ?? undefined,
    venue: sp.get('venue') ?? undefined,
    minRating: sp.get('minRating') ?? undefined,
    maxRating: sp.get('maxRating') ?? undefined,
    from: sp.get('from') ?? undefined,
    to: sp.get('to') ?? undefined,
    q: sp.get('q') ?? undefined,
  });

  const rows = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 5000,
    include: { assignee: { select: { name: true } } },
  });

  const withPii = hasPermission(user, 'feedback.pii');
  const header = [
    'Thời gian', 'Khu vực', 'Phòng/Bàn', 'Điểm chung', 'Phục vụ', 'Ẩm thực', 'Vệ sinh', 'Giá trị',
    'NPS', 'Nhận xét', 'Trạng thái', 'Người xử lý', ...(withPii ? ['Tên khách', 'Liên hệ'] : []),
  ];
  const lines = [header.map(csv).join(',')];
  for (const r of rows) {
    const rt = (r.ratings ?? {}) as Record<string, number>;
    lines.push(
      [
        formatDateTimeVN(r.createdAt, { withSeconds: true }), VENUE_LABELS[r.venue] ?? r.venue, r.location, r.overallRating,
        rt.service, rt.food, rt.cleanliness, rt.value, r.npsScore, r.comment,
        STATUS_LABELS[r.status], r.assignee?.name, ...(withPii ? [r.guestName, r.contact] : []),
      ].map(csv).join(',')
    );
  }

  await audit({ user, action: 'feedback.export', entity: 'feedback', meta: { count: rows.length, pii: withPii } });

  return new NextResponse('\uFEFF' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="feedback-${formatIsoDateVN()}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
