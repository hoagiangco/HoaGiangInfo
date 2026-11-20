/**
 * Single source of truth for roles and permissions of the INTERNAL area.
 * Customers (QR visitors) are NOT users and have none of these permissions.
 *
 * This file must stay free of server-only imports so it can also be used by
 * client components (e.g. to hide menu entries). Hiding UI is cosmetic only:
 * every server action / route handler re-checks through lib/auth/guard.ts.
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';
export type DocVisibility = 'ALL_STAFF' | 'DEPARTMENT' | 'ROLE_MIN' | 'PRIVATE';

export const ROLES: Role[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  STAFF: 'Nhân viên',
};

/** Higher = more privileged. */
export const ROLE_RANK: Record<Role, number> = {
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export type Permission =
  | 'users.manage'
  | 'documents.read'
  | 'documents.write'
  | 'feedback.read' // all feedback
  | 'feedback.read.assigned' // only feedback assigned to me
  | 'feedback.manage' // change status / assign / notes on any feedback
  | 'feedback.export'
  | 'feedback.pii' // see guest name + contact details
  | 'content.manage' // CMS: menu, services, QR codes, ...
  | 'analytics.view'
  | 'audit.view';

const ALL: Permission[] = [
  'users.manage',
  'documents.read',
  'documents.write',
  'feedback.read',
  'feedback.read.assigned',
  'feedback.manage',
  'feedback.export',
  'feedback.pii',
  'content.manage',
  'analytics.view',
  'audit.view',
];

export const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set(ALL),
  ADMIN: new Set(ALL),
  MANAGER: new Set<Permission>([
    'documents.read',
    'documents.write',
    'feedback.read',
    'feedback.read.assigned',
    'feedback.manage',
    'feedback.export',
    'feedback.pii',
    'analytics.view',
  ]),
  STAFF: new Set<Permission>(['documents.read', 'feedback.read.assigned']),
};

export const DEPARTMENTS = [
  'Lễ tân',
  'Buồng phòng',
  'Nhà hàng',
  'Bếp',
  'Kỹ thuật',
  'Kế toán',
  'Kinh doanh',
  'Nhân sự',
  'Bảo vệ',
];

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as string[]).includes(value);
}

export function hasPermission(
  user: Pick<AuthUser, 'role'> | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.has(permission) ?? false;
}

export function permissionsOf(role: Role): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? []);
}

export function isAdminRole(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Roles with rank <= given role (used for ROLE_MIN document filtering). */
export function rolesAtOrBelow(role: Role): Role[] {
  return ROLES.filter((r) => ROLE_RANK[r] <= ROLE_RANK[role]);
}

/** Can `actor` create / modify / delete an account with `target` role? */
export function canManageRole(actor: Role, target: Role): boolean {
  if (actor === 'SUPER_ADMIN') return true;
  if (actor === 'ADMIN') return target !== 'SUPER_ADMIN' && target !== 'ADMIN';
  return false;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface DocAccessInfo {
  visibility: DocVisibility;
  departments: string[];
  minRole: Role | null;
  uploadedById: string | null;
}

export function canViewDocument(user: AuthUser, doc: DocAccessInfo): boolean {
  if (!hasPermission(user, 'documents.read')) return false;
  if (isAdminRole(user.role)) return true;
  if (doc.uploadedById && doc.uploadedById === user.id) return true;

  switch (doc.visibility) {
    case 'ALL_STAFF':
      return true;
    case 'DEPARTMENT':
      return !!user.department && doc.departments.includes(user.department);
    case 'ROLE_MIN':
      return !!doc.minRole && ROLE_RANK[user.role] >= ROLE_RANK[doc.minRole];
    case 'PRIVATE':
    default:
      return false;
  }
}

export function canEditDocument(user: AuthUser, doc: DocAccessInfo): boolean {
  if (!hasPermission(user, 'documents.write')) return false;
  if (isAdminRole(user.role)) return true;
  // Managers: only their own uploads or documents scoped to their department.
  if (doc.uploadedById && doc.uploadedById === user.id) return true;
  return (
    doc.visibility === 'DEPARTMENT' &&
    !!user.department &&
    doc.departments.includes(user.department)
  );
}
