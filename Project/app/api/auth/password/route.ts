import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { createSession, revokeAllSessions } from '@/lib/auth/session';
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '@/lib/auth/password';
import { audit } from '@/lib/auth/audit';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
});

/** Change my own password. All other sessions are revoked. */
export async function POST(request: Request) {
  const g = await apiGuard();
  if (g.error) return g.error;
  const { user } = g;

  const limit = rateLimit(`pwchange:${user.id}`, 5, 15 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Quá nhiều lần thử' }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const strength = validatePasswordStrength(newPassword);
  if (strength) return NextResponse.json({ error: strength }, { status: 400 });

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) {
    return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await revokeAllSessions(user.id);
  await createSession(user.id); // keep the current browser logged in
  await audit({ user, action: 'auth.password_changed' });

  return NextResponse.json({ success: true });
}
