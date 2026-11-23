import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import {
  parseTranslations,
  type FlipbookTranslationFields,
  type InformationTranslationFields,
  type MenuTranslationFields,
} from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await checkAdminSession();
    const { id } = await params;
    const flipbook = await prisma.flipbook.findUnique({
      where: { id },
    });

    if (!flipbook || (!isAdmin && !flipbook.isActive)) {
      return NextResponse.json({ error: 'Flipbook not found' }, { status: 404 });
    }

    return NextResponse.json(flipbook);
  } catch (error) {
    console.error('Error fetching flipbook:', error);
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
    const { name, description, translations, pages, isActive } = body;

    const updateData: any = {
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
    };

    if (translations !== undefined) {
      updateData.translations = toPrismaTranslations<FlipbookTranslationFields>(translations, [
        'name',
        'description',
      ]);
    }

    if (pages && Array.isArray(pages)) {
      updateData.pages = pages;
    }

    const flipbook = await prisma.flipbook.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(flipbook);
  } catch (error: any) {
    console.error('Error updating flipbook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
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
    const existing = await prisma.flipbook.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy flipbook' }, { status: 404 });
    }

    // Clean any localized flipbookId references stored in Menu / Information translations JSON
    const [menus, infos] = await Promise.all([
      prisma.menu.findMany({ select: { id: true, translations: true } }),
      prisma.information.findMany({ select: { id: true, translations: true } }),
    ]);

    for (const m of menus) {
      const t = parseTranslations<MenuTranslationFields>(m.translations);
      let changed = false;
      for (const lang of ['en', 'zh'] as const) {
        if (t[lang]?.flipbookId === id) {
          delete t[lang]!.flipbookId;
          if (Object.keys(t[lang]!).length === 0) delete t[lang];
          changed = true;
        }
      }
      if (changed) {
        await prisma.menu.update({
          where: { id: m.id },
          data: {
            translations:
              Object.keys(t).length > 0
                ? (t as Prisma.InputJsonValue)
                : Prisma.JsonNull,
          },
        });
      }
    }

    for (const info of infos) {
      const t = parseTranslations<InformationTranslationFields>(info.translations);
      let changed = false;
      for (const lang of ['en', 'zh'] as const) {
        if (t[lang]?.flipbookId === id) {
          delete t[lang]!.flipbookId;
          if (Object.keys(t[lang]!).length === 0) delete t[lang];
          changed = true;
        }
      }
      if (changed) {
        await prisma.information.update({
          where: { id: info.id },
          data: {
            translations:
              Object.keys(t).length > 0
                ? (t as Prisma.InputJsonValue)
                : Prisma.JsonNull,
          },
        });
      }
    }

    await prisma.flipbook.delete({ where: { id } });

    await audit({
      user: g.user,
      action: 'flipbook.delete',
      entity: 'flipbook',
      entityId: id,
      meta: { name: existing.name, pagesCount: existing.pages.length },
    });

    return NextResponse.json({ message: 'Flipbook deleted' });
  } catch (error) {
    console.error('Error deleting flipbook:', error);
    return NextResponse.json(
      { error: 'Không thể xóa flipbook' },
      { status: 500 }
    );
  }
}









