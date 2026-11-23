import { prisma } from './prisma';

export interface QRCodeInfo {
  id: string;
  name: string;
  token: string;
  type: string;
  isActive: boolean;
  modules: string[];
}

/**
 * Modules a QR code may ever unlock. A QR code identifies a *place*, not a
 * person, so it can only grant access to customer-facing content. Internal
 * documents (the old "technical" module) are deliberately NOT here: they are
 * only reachable by logged-in staff in /admin.
 */
export const GUEST_MODULES = ['menu', 'floor-plan', 'services', 'information'];

/** Legacy QR type that used to unlock staff content. Now rejected. */
const RETIRED_QR_TYPES = ['staff'];

export async function verifyQRToken(token: string): Promise<QRCodeInfo | null> {
  if (!token || token.length > 128) return null;
  try {
    let qrCode = await prisma.qRCode.findUnique({
      where: { token },
      include: {
        modules: {
          include: {
            module: { select: { name: true } },
          },
        },
      },
    });

    // If 'guest' token doesn't exist yet in DB, seamlessly fallback to 'guest-2024' or any active guest QR
    if (!qrCode && token === 'guest') {
      qrCode = await prisma.qRCode.findFirst({
        where: {
          OR: [{ token: 'guest-2024' }, { type: 'guest' }],
          isActive: true,
        },
        include: {
          modules: {
            include: {
              module: { select: { name: true } },
            },
          },
        },
      });
    }

    if (!qrCode || !qrCode.isActive) {
      return null;
    }
    if (RETIRED_QR_TYPES.includes(qrCode.type)) {
      return null;
    }

    return {
      id: qrCode.id,
      name: qrCode.name,
      token: token,
      type: qrCode.type,
      isActive: qrCode.isActive,
      modules: qrCode.modules
        .map((qm) => qm.module.name)
        .filter((name) => GUEST_MODULES.includes(name)),
    };
  } catch (error) {
    console.error('Error verifying QR token:', error);
    return null;
  }
}

export async function checkModuleAccess(
  token: string,
  moduleName: string
): Promise<boolean> {
  if (!GUEST_MODULES.includes(moduleName)) return false;
  const qrInfo = await verifyQRToken(token);
  if (!qrInfo) return false;
  return qrInfo.modules.includes(moduleName);
}
