import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { MenuTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminSession();
    const { id } = await params;
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          where: isAdmin ? undefined : { isAvailable: true },
          orderBy: { category: 'asc' },
        },
      },
    });

    if (!menu || (!isAdmin && !menu.isActive)) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, translations, isActive, fileUrl, fileType, flipbookId } = body;

    // Build update data object, only including fields that are provided
    const updateData: any = {
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
    };

    if (translations !== undefined) {
      updateData.translations = toPrismaTranslations<MenuTranslationFields>(translations, [
        'name',
        'description',
        'fileUrl',
        'flipbookId',
      ]);
    }

    // Only update fileUrl and fileType if they are provided
    if (fileUrl !== undefined) {
      updateData.fileUrl = fileUrl || null;
    }
    if (fileType !== undefined) {
      updateData.fileType = fileType || null;
    }
    if (flipbookId !== undefined) {
      updateData.flipbookId = flipbookId || null;
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(menu);
  } catch (error: any) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const g = await apiGuard('content.manage');
  if (g.error) return g.error;

  try {
    const { id } = await params;
    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy thực đơn' }, { status: 404 });
    }

    await prisma.menu.delete({ where: { id } });
    await audit({
      user: g.user,
      action: 'menu.delete',
      entity: 'menu',
      entityId: id,
      meta: { name: existing.name },
    });

    return NextResponse.json({ message: 'Menu deleted' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Không thể xóa thực đơn' },
      { status: 500 }
    );
  }
}


