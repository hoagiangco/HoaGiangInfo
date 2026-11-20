import 'server-only';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './session';
import { hasPermission, type AuthUser, type Permission } from './permissions';

/**
 * Guards for the INTERNAL area. Every internal page / API must go through one
 * of these. Deny by default.
 */

// ----- Server components / layouts / pages ---------------------------------

/** Requires a logged-in user, otherwise redirects to /login. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * Requires a logged-in user holding at least one of the permissions.
 * Logged-in users without permission are sent to the dashboard (not login).
 */
export async function requirePermission(
  ...permissions: Permission[]
): Promise<AuthUser> {
  const user = await requireUser();
  if (!permissions.some((p) => hasPermission(user, p))) redirect('/admin');
  return user;
}

// ----- Route handlers --------------------------------------------------------

export type ApiGuardResult =
  | { user: AuthUser; error?: undefined }
  | { user?: undefined; error: NextResponse };

/**
 * Usage:
 *   const g = await apiGuard('documents.write');
 *   if (g.error) return g.error;
 *   const user = g.user;
 */
export async function apiGuard(
  ...permissions: Permission[]
): Promise<ApiGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  if (permissions.length > 0 && !permissions.some((p) => hasPermission(user, p))) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { user };
}
