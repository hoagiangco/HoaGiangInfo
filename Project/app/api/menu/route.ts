import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        items: {
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
    const { name, description, fileUrl, fileType, flipbookId } = body;

    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        flipbookId: flipbookId || null,
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


