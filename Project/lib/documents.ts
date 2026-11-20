import type { Prisma } from '@prisma/client';
import { isAdminRole, rolesAtOrBelow, type AuthUser } from '@/lib/auth/permissions';

export const DOC_CATEGORIES: Record<string, string> = {
  maintenance: 'Báº£o trÃ¬',
  cleaning: 'Vá»‡ sinh',
  safety: 'An toÃ n',
  equipment: 'Thiáº¿t bá»‹',
  procedures: 'Quy trÃ¬nh',
  hr: 'NhÃ¢n sá»±',
  finance: 'TÃ i chÃ­nh',
  other: 'KhÃ¡c',
};

export const VISIBILITY_LABELS: Record<string, string> = {
  ALL_STAFF: 'ToÃ n bá»™ nhÃ¢n viÃªn',
  DEPARTMENT: 'Theo phÃ²ng ban',
  ROLE_MIN: 'Tá»« vai trÃ² trá»Ÿ lÃªn',
  PRIVATE: 'RiÃªng tÆ° (admin + ngÆ°á»i táº£i lÃªn)',
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
