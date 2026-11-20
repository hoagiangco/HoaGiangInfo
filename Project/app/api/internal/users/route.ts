import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { canManageRole, isRole, ROLES } from '@/lib/auth/permissions';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

const createSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(1).max(100),
  role: z.enum(ROLES as [string, ...string[]]),
  department: z.string().trim().max(60).nullable().optional(),
  password: z.string().min(1).max(128),
});

export async function GET() {
  const g = await apiGuard('users.manage');
  if (g.error) return g.error;

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true, role: true, department: true,
      isActive: true, lastLoginAt: true, createdAt: true,
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const g = await apiGuard('users.manage');
  if (g.error) return g.error;
  const { user } = g;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  const { email, name, role, department, password } = parsed.data;

  if (!isRole(role) || !canManageRole(user.role, role)) {
    return NextResponse.json({ error: 'Bạn không có quyền tạo vai trò này' }, { status: 403 });
  }
  const strength = validatePasswordStrength(password);
  if (strength) return NextResponse.json({ error: strength }, { status: 400 });

  if (await prisma.user.findUnique({ where: { email } })) {
    return NextResponse.json({ error: 'Email đã tồn tại' }, { status: 409 });
  }

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      department: department || null,
      passwordHash: await hashPassword(password),
    },
    select: { id: true, email: true, role: true },
  });

  await audit({ user, action: 'user.create', entity: 'user', entityId: created.id, meta: { email, role } });
  return NextResponse.json(created, { status: 201 });
}
