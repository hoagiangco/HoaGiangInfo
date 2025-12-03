import { prisma } from './prisma';

export interface QRCodeInfo {
  id: string;
  name: string;
  token: string;
  type: string;
  isActive: boolean;
  modules: string[];
}

export async function verifyQRToken(token: string): Promise<QRCodeInfo | null> {
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { token },
      include: {
        modules: {
          include: {
            module: true,
          },
        },
      },
    });

    if (!qrCode || !qrCode.isActive) {
      return null;
    }

    return {
      id: qrCode.id,
      name: qrCode.name,
      token: qrCode.token,
      type: qrCode.type,
      isActive: qrCode.isActive,
      modules: qrCode.modules.map((qm) => qm.module.name),
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
  const qrInfo = await verifyQRToken(token);
  if (!qrInfo) return false;
  return qrInfo.modules.includes(moduleName);
}







