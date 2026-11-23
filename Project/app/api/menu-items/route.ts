import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { MenuItemTranslationFields } from '@/lib/translations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');

    const items = await prisma.menuItem.findMany({
      where: menuId ? { menuId } : undefined,
      orderBy: { category: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
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
    const { menuId, name, description, translations, price, image, category } = body;

    const item = await prisma.menuItem.create({
      data: {
        menuId,
        name,
        description,
        translations: toPrismaTranslations<MenuItemTranslationFields>(translations, [
          'name',
          'description',
          'category',
        ]),
        price: price ? parseFloat(price) : null,
        image,
        category,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










