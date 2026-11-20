import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { hasPermission } from '@/lib/auth/permissions';

const schema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']).optional(),
  assigneeId: z.string().min(1).max(50).nullable().optional(),
  note: z.string().trim().min(1).max(2000).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const g = await apiGuard('feedback.manage', 'feedback.read.assigned');
  if (g.error) return g.error;
  const { user } = g;

  const fb = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!fb) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const canManage = hasPermission(user, 'feedback.manage');
  const isAssignee = fb.assigneeId === user.id;
  // Not allowed unless manager, or the person the feedback was assigned to.
  if (!canManage && !isAssignee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  const { status, assigneeId, note } = parsed.data;

  if (assigneeId !== undefined && !canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const events: { type: string; detail: string }[] = [];
  const data: Record<string, unknown> = {};

  if (status && status !== fb.status) {
    data.status = status;
    events.push({ type: 'status', detail: `${fb.status} → ${status}` });
  }

  if (assigneeId !== undefined && assigneeId !== fb.assigneeId) {
    if (assigneeId) {
      const target = await prisma.user.findUnique({ where: { id: assigneeId } });
      if (!target || !target.isActive) {
        return NextResponse.json({ error: 'Người được giao không hợp lệ' }, { status: 400 });
      }
      events.push({ type: 'assign', detail: `Giao cho ${target.name}` });
    } else {
      events.push({ type: 'assign', detail: 'Bỏ giao việc' });
    }
    data.assigneeId = assigneeId;
    // Auto move NEW -> IN_PROGRESS when assigned
    if (assigneeId && fb.status === 'NEW' && !status) {
      data.status = 'IN_PROGRESS';
    }
  }

  if (note) events.push({ type: 'note', detail: note });

  if (events.length === 0 && Object.keys(data).length === 0) {
    return NextResponse.json({ success: true });
  }

  await prisma.$transaction([
    prisma.feedback.update({ where: { id: fb.id }, data }),
    ...events.map((e) =>
      prisma.feedbackEvent.create({
        data: { feedbackId: fb.id, userId: user.id, userEmail: user.email, type: e.type, detail: e.detail },
      })
    ),
  ]);

  await audit({ user, action: 'feedback.update', entity: 'feedback', entityId: fb.id, meta: { status, assigneeId, note: !!note } });
  return NextResponse.json({ success: true });
}
