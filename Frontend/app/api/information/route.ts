import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const information = await prisma.information.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(information);
  } catch (error) {
    console.error('Error fetching information:', error);
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
    const { category, title, content, icon, order } = body;

    const information = await prisma.information.create({
      data: {
        category,
        title,
        content,
        icon,
        order: order || 0,
      },
    });

    return NextResponse.json(information, { status: 201 });
  } catch (error) {
    console.error('Error creating information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







