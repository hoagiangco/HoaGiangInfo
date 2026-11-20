import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';
import { isRole, type AuthUser } from './permissions';

export const SESSION_COOKIE = 'hg_session';

/** Absolute lifetime of a session. */
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Session dies after this much inactivity. */
const SESSION_IDLE_MS = 8 * 60 * 60 * 1000;
/** Do not write lastSeenAt more often than this. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function cookieSecure(): boolean {
  // Explicit override wins.
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true';
  // Otherwise: Secure iff the site is served over HTTPS (directly, via the
  // reverse proxy's X-Forwarded-Proto, or per NEXT_PUBLIC_APP_URL). A Secure
  // cookie is silently dropped by browsers on plain HTTP, which would make
  // login impossible.
  if (headers().get('x-forwarded-proto')?.split(',')[0].trim() === 'https') return true;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').split(',')[0].trim();
  return appUrl.startsWith('https://');
}

/** Creates a DB-backed session and sets the cookie. Returns nothing sensitive. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const h = headers();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: getClientIp(h),
      userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
    },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/** Deletes the current session (server side) and the cookie. */
export async function destroyCurrentSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookies().delete(SESSION_COOKIE);
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Resolves the logged-in internal user from the cookie, or null.
 * Validates against the DB on every request: revoked sessions, disabled
 * accounts, expired or idle sessions are all rejected immediately.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || token.length < 32 || token.length > 128) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  const now = Date.now();
  const expired =
    session.expiresAt.getTime() <= now ||
    now - session.lastSeenAt.getTime() > SESSION_IDLE_MS;

  if (expired || !session.user.isActive || !isRole(session.user.role)) {
    await prisma.session.deleteMany({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  if (now - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {});
  }

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    department: u.department,
  };
});
