import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { FloorPlanTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: params.id },
      include: {
        rooms: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!floorPlan) {
      return NextResponse.json(
        { error: 'Floor plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error fetching floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, translations, imageUrl, fileType, isActive } = body;

    const floorPlan = await prisma.floorPlan.update({
      where: { id: params.id },
      data: {
        name,
        description,
        ...(translations !== undefined
          ? {
              translations: toPrismaTranslations<FloorPlanTranslationFields>(translations, [
                'name',
                'description',
                'imageUrl',
                'fileType',
              ]),
            }
          : {}),
        imageUrl,
        fileType,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error updating floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const g = await apiGuard('content.manage');
  if (g.error) return g.error;

  try {
    const existing = await prisma.floorPlan.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy sơ đồ phòng' }, { status: 404 });
    }

    await prisma.floorPlan.delete({ where: { id: params.id } });
    await audit({
      user: g.user,
      action: 'floor_plan.delete',
      entity: 'floorPlan',
      entityId: params.id,
      meta: { name: existing.name },
    });

    return NextResponse.json({ message: 'Floor plan deleted' });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return NextResponse.json(
      { error: 'Không thể xóa sơ đồ phòng' },
      { status: 500 }
    );
  }
}









