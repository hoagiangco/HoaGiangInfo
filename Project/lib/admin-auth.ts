import 'server-only';
import { getCurrentUser } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';

/**
 * Backwards-compatible helper used by the existing content-management API
 * routes (menu, services, QR codes, uploads, import/export, ...).
 *
 * It now validates a real, server-side session and requires the
 * `content.manage` permission (ADMIN / SUPER_ADMIN). The old forgeable
 * `admin_session=authenticated` cookie and the shared ADMIN_PASSWORD are gone.
 *
 * New code should prefer `apiGuard(...)` from '@/lib/auth/guard'.
 */
export async function checkAdminSession(): Promise<boolean> {
  const user = await getCurrentUser();
  return hasPermission(user, 'content.manage');
}
