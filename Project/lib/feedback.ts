import type { Prisma } from '@prisma/client';
import { hasPermission, type AuthUser } from '@/lib/auth/permissions';
import { parseVNDateBoundary } from '@/lib/locale';

export const VENUE_LABELS: Record<string, string> = {
  hotel: 'Khách sạn / Lưu trú',
  restaurant: 'Nhà hàng',
  spa: 'Spa / Gym / Tiện ích',
  other: 'Khác',
};

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
};

export const CRITERIA_LABELS: Record<string, string> = {
  service: 'Phục vụ',
  food: 'Ẩm thực',
  cleanliness: 'Vệ sinh',
  value: 'Giá trị',
};

export interface FeedbackFilters {
  status?: string;
  venue?: string;
  minRating?: string;
  maxRating?: string;
  from?: string;
  to?: string;
  q?: string;
}

function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  return parseVNDateBoundary(value, endOfDay);
}

function parseRating(value: string | undefined): number | undefined {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

/**
 * Builds the Prisma filter for feedback queries. The permission scope is the
 * FIRST clause: users without `feedback.read` only ever see feedback assigned
 * to them, no matter what filters they pass.
 */
export function buildFeedbackWhere(
  user: AuthUser,
  f: FeedbackFilters
): Prisma.FeedbackWhereInput {
  const and: Prisma.FeedbackWhereInput[] = [];

  if (!hasPermission(user, 'feedback.read')) {
    and.push({ assigneeId: user.id });
  }

  if (f.status === 'OPEN') and.push({ status: { not: 'RESOLVED' } });
  else if (f.status && f.status in STATUS_LABELS) {
    and.push({ status: f.status as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' });
  }

  if (f.venue && f.venue in VENUE_LABELS) and.push({ venue: f.venue });

  const min = parseRating(f.minRating);
  const max = parseRating(f.maxRating);
  if (min || max) and.push({ overallRating: { ...(min ? { gte: min } : {}), ...(max ? { lte: max } : {}) } });

  const from = parseDate(f.from);
  const to = parseDate(f.to, true);
  if (from || to) and.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });

  const q = f.q?.trim().slice(0, 100);
  if (q) {
    and.push({
      OR: [
        { comment: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  return and.length ? { AND: and } : {};
}
