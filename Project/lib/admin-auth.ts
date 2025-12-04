import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// In production, hash should be stored in env
// For now, we'll use a simple comparison
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === correctPassword;
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_KEY, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_KEY);
  return session?.value === 'authenticated';
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_KEY);
}










