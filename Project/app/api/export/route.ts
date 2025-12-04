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
    const type = searchParams.get('type') || 'all';

    let data: any = {};

    if (type === 'all' || type === 'qr') {
      data.qrCodes = await prisma.qRCode.findMany({
        include: {
          modules: {
            include: {
              module: true,
            },
          },
        },
      });
    }

    if (type === 'all' || type === 'menu') {
      data.menus = await prisma.menu.findMany({
        include: {
          items: true,
        },
      });
    }

    if (type === 'all' || type === 'services') {
      data.services = await prisma.service.findMany();
    }

    if (type === 'all' || type === 'information') {
      data.information = await prisma.information.findMany();
    }

    if (type === 'all' || type === 'documents') {
      data.technicalDocuments = await prisma.technicalDocument.findMany();
    }

    if (type === 'all' || type === 'floor-plans') {
      data.floorPlans = await prisma.floorPlan.findMany({
        include: {
          rooms: true,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="resort-data-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










