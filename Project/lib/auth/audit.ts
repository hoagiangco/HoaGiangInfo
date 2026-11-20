import 'server-only';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';
import type { Prisma } from '@prisma/client';

interface AuditInput {
  user?: { id: string; email: string } | null;
  userEmail?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
}

/** Best-effort audit trail: failures never break the user's request. */
export async function audit(input: AuditInput): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      ip = getClientIp(headers());
    } catch {
      ip = null;
    }
    await prisma.auditLog.create({
      data: {
        userId: input.user?.id ?? null,
        userEmail: input.user?.email ?? input.userEmail ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        meta: input.meta,
        ipAddress: ip,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
