import type { Prisma } from '@prisma/client';
import { isAdminRole, rolesAtOrBelow, type AuthUser } from '@/lib/auth/permissions';

export const DOC_CATEGORIES: Record<string, string> = {
  maintenance: 'Bảo trì',
  cleaning: 'Vệ sinh',
  safety: 'An toàn',
  equipment: 'Thiết bị',
  procedures: 'Quy trình',
  hr: 'Nhân sự',
  finance: 'Tài chính',
  other: 'Khác',
};

export const VISIBILITY_LABELS: Record<string, string> = {
  ALL_STAFF: 'Toàn bộ nhân viên',
  DEPARTMENT: 'Theo phòng ban',
  ROLE_MIN: 'Từ vai trò trở lên',
  PRIVATE: 'Riêng tư (quản trị viên + người tải lên)',
};

/**
 * Prisma `where` fragment restricting documents to what `user` may see.
 * ALWAYS spread this into queries on TechnicalDocument - this is what keeps
 * "list" endpoints and pages from leaking restricted documents.
 */
export function documentVisibilityWhere(
  user: AuthUser
): Prisma.TechnicalDocumentWhereInput {
  if (isAdminRole(user.role)) return {};

  const or: Prisma.TechnicalDocumentWhereInput[] = [
    { visibility: 'ALL_STAFF' },
    { uploadedById: user.id },
    { visibility: 'ROLE_MIN', minRole: { in: rolesAtOrBelow(user.role) } },
  ];
  if (user.department) {
    or.push({ visibility: 'DEPARTMENT', departments: { has: user.department } });
  }
  return { OR: or };
}
