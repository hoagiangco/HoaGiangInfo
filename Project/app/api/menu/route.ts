import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { MenuTranslationFields } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAdmin = await checkAdminSession();
    const menus = await prisma.menu.findMany({
      where: isAdmin ? undefined : { isActive: true },
      include: {
        items: {
          where: isAdmin ? undefined : { isAvailable: true },
          orderBy: { category: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(menus);
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, translations, fileUrl, fileType, flipbookId, isActive } = body;

    const menu = await prisma.menu.create({
      data: {
        name,
        description: description || null,
        translations: toPrismaTranslations<MenuTranslationFields>(translations, [
          'name',
          'description',
          'fileUrl',
          'flipbookId',
        ]),
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        flipbookId: flipbookId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


