import { NextResponse } from 'next/server';
import { destroyCurrentSession, getCurrentUser } from '@/lib/auth/session';
import { audit } from '@/lib/auth/audit';

export async function POST() {
  const user = await getCurrentUser();
  await destroyCurrentSession();
  if (user) await audit({ user, action: 'auth.logout' });
  return NextResponse.json({ success: true });
}
