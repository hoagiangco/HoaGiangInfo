import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { ServiceTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
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
    const { name, type, description, translations, images, hours, location, isActive } = body;

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        type,
        description,
        ...(translations !== undefined
          ? {
              translations: toPrismaTranslations<ServiceTranslationFields>(translations, [
                'name',
                'description',
                'hours',
                'location',
              ]),
            }
          : {}),
        images: images || [],
        hours,
        location,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
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
    const existing = await prisma.service.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy dịch vụ' }, { status: 404 });
    }

    await prisma.service.delete({ where: { id: params.id } });
    await audit({
      user: g.user,
      action: 'service.delete',
      entity: 'service',
      entityId: params.id,
      meta: { name: existing.name, type: existing.type },
    });

    return NextResponse.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Không thể xóa dịch vụ' },
      { status: 500 }
    );
  }
}










