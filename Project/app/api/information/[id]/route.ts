import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const information = await prisma.information.findUnique({
      where: { id: params.id },
    });

    if (!information) {
      return NextResponse.json(
        { error: 'Information not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(information);
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
    const { category, title, content, icon, order, isActive } = body;

    const information = await prisma.information.update({
      where: { id: params.id },
      data: {
        category,
        title,
        content,
        icon,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
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
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.information.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Information deleted' });
  } catch (error) {
    console.error('Error deleting information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










