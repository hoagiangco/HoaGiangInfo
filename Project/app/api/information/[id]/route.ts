import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { InformationTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminSession();
    const information = await prisma.information.findUnique({
      where: { id: params.id },
      include: {
        flipbook: true,
      },
    });

    if (!information || (!isAdmin && !information.isActive)) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      );
    }

    const sanitized =
      !isAdmin && information.flipbook && !information.flipbook.isActive
        ? { ...information, flipbook: null }
        : information;

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching information:', error);
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
    const {
      category,
      title,
      content,
      translations,
      fileUrl,
      fileType,
      flipbookId,
      icon,
      order,
      isActive,
    } = body;

    const updateData: any = {
      category,
      title,
      content: content ?? '',
      icon,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    };

    if (translations !== undefined) {
      updateData.translations =
        toPrismaTranslations<InformationTranslationFields>(translations, [
          'title',
          'content',
          'fileUrl',
          'flipbookId',
        ]);
    }
    if (fileType !== undefined) {
      updateData.fileType = fileType || null;
    }
    if (fileUrl !== undefined) {
      updateData.fileUrl = fileType === 'flipbook' ? null : fileUrl || null;
    }
    if (flipbookId !== undefined) {
      updateData.flipbookId =
        fileType === 'flipbook' ? flipbookId || null : null;
    }

    const information = await prisma.information.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(information);
  } catch (error) {
    console.error('Error updating information:', error);
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
    const existing = await prisma.information.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy mục thông tin' }, { status: 404 });
    }

    await prisma.information.delete({ where: { id: params.id } });
    await audit({
      user: g.user,
      action: 'information.delete',
      entity: 'information',
      entityId: params.id,
      meta: { title: existing.title, category: existing.category },
    });

    return NextResponse.json({ message: 'Information deleted' });
  } catch (error) {
    console.error('Error deleting information:', error);
    return NextResponse.json(
      { error: 'Không thể xóa mục thông tin' },
      { status: 500 }
    );
  }
}
