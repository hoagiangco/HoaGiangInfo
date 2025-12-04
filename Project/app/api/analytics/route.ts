import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

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
        qrCodeName: qrCode?.name || 'Unknown',
        qrCodeToken: qrCode?.token || '',
        count: scan._count.id,
      };
    });

    // Scans by day
    const scansByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        DATE(scanned_at) as date,
        COUNT(*)::int as count
      FROM "QRCodeScan"
      WHERE scanned_at >= ${startDate}
      GROUP BY DATE(scanned_at)
      ORDER BY date ASC
    `;

    // Most accessed modules (based on scans)
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
      const module = modules.find((m) => m.id === access.moduleId);
      return {
        moduleName: module?.displayName || 'Unknown',
        qrCodeCount: access._count.id,
      };
    });

    return NextResponse.json({
      totalScans,
      scansByQR: scansWithNames,
      scansByDay: scansByDay.map((s) => ({
        date: s.date,
        count: Number(s.count),
      })),
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










