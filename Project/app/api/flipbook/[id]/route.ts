import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const flipbook = await prisma.flipbook.findUnique({
      where: { id },
    });

    if (!flipbook) {
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
    const { name, description, pages, isActive } = body;

    const updateData: any = {
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
    };

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
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.flipbook.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Flipbook deleted' });
  } catch (error) {
    console.error('Error deleting flipbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









