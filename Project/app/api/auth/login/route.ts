import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth/session';
import { getDummyHash, verifyPassword } from '@/lib/auth/password';
import { audit } from '@/lib/auth/audit';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

const GENERIC_ERROR = 'Email hoặc mật khẩu không đúng';

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  // Per-IP throttle (10 attempts / 10 minutes)
  const ipLimit = rateLimit(`login:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: 'Quá nhiều lần thử. Vui lòng thử lại sau.' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  let parsed;
  try {
    parsed = schema.safeParse(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed || !parsed.success) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt so response time does not reveal whether the email exists.
  const hash = user?.passwordHash ?? getDummyHash();
  const passwordOk = await verifyPassword(password, hash);

  if (!user || !user.isActive) {
    await audit({ userEmail: email, action: 'auth.login_failed', meta: { reason: 'unknown_or_disabled' } });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await audit({ user, action: 'auth.login_blocked', meta: { reason: 'locked' } });
    return NextResponse.json(
      { error: 'Tài khoản tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau.' },
      { status: 429 }
    );
  }

  if (!passwordOk) {
    const failed = user.failedAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data:
        failed >= MAX_FAILED
          ? { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
          : { failedAttempts: failed },
    });
    await audit({ user, action: 'auth.login_failed', meta: { reason: 'bad_password', failed } });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  // Drop expired sessions of this user (housekeeping)
  await prisma.session.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  await createSession(user.id);
  await audit({ user, action: 'auth.login' });

  return NextResponse.json({ success: true });
}
