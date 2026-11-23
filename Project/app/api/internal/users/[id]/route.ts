import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { revokeAllSessions } from '@/lib/auth/session';
import { canManageRole, isRole, ROLES } from '@/lib/auth/permissions';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

const patchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(ROLES as [string, ...string[]]).optional(),
  department: z.string().trim().max(60).nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(1).max(128).optional(), // admin reset
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const g = await apiGuard('users.manage');
  if (g.error) return g.error;
  const { user: actor } = g;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || !isRole(target.role)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Actor must outrank the target's current role...
  if (!canManageRole(actor.role, target.role)) {
    return NextResponse.json({ error: 'Bạn không có quyền sửa tài khoản này' }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  const { name, role, department, isActive, password } = parsed.data;

  const isSelf = actor.id === target.id;
  if (isSelf && (role !== undefined || isActive === false)) {
    return NextResponse.json({ error: 'Không thể tự đổi vai trò / khóa chính mình' }, { status: 400 });
  }
  // ...and may only grant roles it is allowed to manage.
  if (role !== undefined && (!isRole(role) || !canManageRole(actor.role, role))) {
    return NextResponse.json({ error: 'Bạn không có quyền gán vai trò này' }, { status: 403 });
  }

  // Never leave the system without an active SUPER_ADMIN.
  const losesSuper =
    target.role === 'SUPER_ADMIN' &&
    ((role !== undefined && role !== 'SUPER_ADMIN') || isActive === false);
  if (losesSuper) {
    const others = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true, id: { not: target.id } },
    });
    if (others === 0) {
      return NextResponse.json({ error: 'Phải còn ít nhất một Super Admin hoạt động' }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (role !== undefined) data.role = role;
  if (department !== undefined) data.department = department || null;
  if (isActive !== undefined) {
    data.isActive = isActive;
    if (isActive) {
      data.failedAttempts = 0;
      data.lockedUntil = null;
    }
  }
  if (password !== undefined) {
    const strength = validatePasswordStrength(password);
    if (strength) return NextResponse.json({ error: strength }, { status: 400 });
    data.passwordHash = await hashPassword(password);
    data.failedAttempts = 0;
    data.lockedUntil = null;
  }

  await prisma.user.update({ where: { id: target.id }, data });

  // Privilege / credential changes take effect immediately.
  if (isActive === false || password !== undefined || role !== undefined) {
    await revokeAllSessions(target.id);
  }

  await audit({
    user: actor,
    action: 'user.update',
    entity: 'user',
    entityId: target.id,
    meta: { email: target.email, role, isActive, passwordReset: password !== undefined },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const g = await apiGuard('users.manage');
  if (g.error) return g.error;
  const { user: actor } = g;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target || !isRole(target.role)) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
  }

  if (actor.id === target.id) {
    return NextResponse.json({ error: 'Không thể tự xóa tài khoản của chính mình' }, { status: 400 });
  }

  if (!canManageRole(actor.role, target.role)) {
    return NextResponse.json({ error: 'Bạn không có quyền xóa tài khoản này' }, { status: 403 });
  }

  if (target.role === 'SUPER_ADMIN') {
    const others = await prisma.user.count({
      where: { role: 'SUPER_ADMIN', isActive: true, id: { not: target.id } },
    });
    if (others === 0) {
      return NextResponse.json({ error: 'Phải còn ít nhất một Super Admin hoạt động' }, { status: 400 });
    }
  }

  await revokeAllSessions(target.id);
  await prisma.user.delete({ where: { id: target.id } });

  await audit({
    user: actor,
    action: 'user.delete',
    entity: 'user',
    entityId: target.id,
    meta: { email: target.email, role: target.role },
  });
  return NextResponse.json({ success: true });
}
