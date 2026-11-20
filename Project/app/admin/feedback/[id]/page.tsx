import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { hasPermission } from '@/lib/auth/permissions';
import { CRITERIA_LABELS, STATUS_LABELS, VENUE_LABELS, buildFeedbackWhere } from '@/lib/feedback';
import FeedbackManagePanel from '@/components/FeedbackManagePanel';

export default async function FeedbackDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePermission('feedback.read', 'feedback.read.assigned');

  // buildFeedbackWhere restricts STAFF to feedback assigned to them (IDOR-safe).
  const fb = await prisma.feedback.findFirst({
    where: { AND: [{ id: params.id }, buildFeedbackWhere(user, {})] },
    include: { assignee: { select: { id: true, name: true } }, events: { orderBy: { createdAt: 'desc' } } },
  });
  if (!fb) notFound();

  const canPii = hasPermission(user, 'feedback.pii');
  const canManage = hasPermission(user, 'feedback.manage');
  const canAct = canManage || fb.assigneeId === user.id;

  const users = canManage
    ? await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' },
      })
    : [];

  if (canPii && (fb.guestName || fb.contact)) {
    await audit({ user, action: 'feedback.view_pii', entity: 'feedback', entityId: fb.id });
  }

  const ratings = (fb.ratings ?? {}) as Record<string, number>;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/feedback" className="text-sm text-primary-600">← Danh sách phản hồi</Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">
        {fb.overallRating} <span className="text-yellow-400">★</span> · {VENUE_LABELS[fb.venue] ?? fb.venue}
        <span className="ml-3 text-sm font-normal text-gray-500">{fb.createdAt.toLocaleString('vi-VN')}</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nhận xét</p>
              <p className="text-gray-800 whitespace-pre-wrap">{fb.comment ?? '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(CRITERIA_LABELS).map(([k, label]) => (
                <div key={k}><span className="text-gray-500">{label}: </span>{ratings[k] ? `${ratings[k]} ★` : '—'}</div>
              ))}
              <div><span className="text-gray-500">NPS: </span>{fb.npsScore ?? '—'}</div>
              <div><span className="text-gray-500">Phòng/Bàn: </span>{fb.location ?? '—'}</div>
              <div><span className="text-gray-500">Ngôn ngữ: </span>{fb.language}</div>
              <div><span className="text-gray-500">Trạng thái: </span>{STATUS_LABELS[fb.status]}</div>
              <div><span className="text-gray-500">Người xử lý: </span>{fb.assignee?.name ?? '—'}</div>
            </div>
            <div className="border-t pt-4 text-sm">
              <p className="text-gray-500 mb-1">Thông tin liên hệ của khách</p>
              {canPii ? (
                <p>{fb.guestName ?? '—'} · {fb.contact ?? '—'}</p>
              ) : (
                <p className="text-gray-400">Chỉ quản lý mới xem được</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Lịch sử xử lý</h2>
            {fb.events.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có hoạt động</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {fb.events.map((e) => (
                  <li key={e.id} className="border-l-2 border-gray-200 pl-3">
                    <p className="text-xs text-gray-500">{e.createdAt.toLocaleString('vi-VN')} · {e.userEmail ?? 'hệ thống'}</p>
                    <p className="whitespace-pre-wrap">{e.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {canAct && (
          <FeedbackManagePanel
            id={fb.id}
            status={fb.status}
            assigneeId={fb.assigneeId}
            canAssign={canManage}
            users={users}
          />
        )}
      </div>
    </div>
  );
}
