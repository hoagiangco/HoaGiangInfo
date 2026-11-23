import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { formatIsoDateVN } from '@/lib/locale';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedDays = parseInt(searchParams.get('days') || '30', 10);
    const days = Number.isFinite(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 3650) : 30;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // QR Code scans
    const totalScans = await prisma.qRCodeScan.count({
      where: {
        scannedAt: {
          gte: startDate,
        },
      },
    });

    // Scans by QR code
    const scansByQR = await prisma.qRCodeScan.groupBy({
      by: ['qrCodeId'],
      where: {
        scannedAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get QR code names
    const qrCodes = await prisma.qRCode.findMany({
      select: {
        id: true,
        name: true,
        token: true,
      },
    });

    const scansWithNames = scansByQR.map((scan) => {
      const qrCode = qrCodes.find((q) => q.id === scan.qrCodeId);
      return {
        qrCodeName: qrCode?.name || 'Không xác định',
        qrCodeToken: qrCode?.token || '',
        count: scan._count.id,
      };
    });

    // Group scans by calendar day in Vietnam timezone (Asia/Ho_Chi_Minh)
    const rawScans = await prisma.qRCodeScan.findMany({
      where: {
        scannedAt: {
          gte: startDate,
        },
      },
      select: {
        scannedAt: true,
      },
      orderBy: {
        scannedAt: 'asc',
      },
    });

    const scansByDayMap = new Map<string, number>();
    for (const scan of rawScans) {
      const dayKey = formatIsoDateVN(scan.scannedAt);
      scansByDayMap.set(dayKey, (scansByDayMap.get(dayKey) ?? 0) + 1);
    }

    const scansByDay = Array.from(scansByDayMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Most accessed modules (based on QR assignments)
    const moduleAccess = await prisma.qRModule.groupBy({
      by: ['moduleId'],
      _count: {
        id: true,
      },
    });

    const modules = await prisma.module.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
      },
    });

    const moduleStats = moduleAccess.map((access) => {
      const mod = modules.find((m) => m.id === access.moduleId);
      return {
        moduleName: mod?.displayName || 'Không xác định',
        qrCodeCount: access._count.id,
      };
    });

    return NextResponse.json({
      totalScans,
      scansByQR: scansWithNames,
      scansByDay,
      moduleStats,
      period: days,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
