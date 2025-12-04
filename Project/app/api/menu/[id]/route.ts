import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { category: 'asc' },
        },
      },
    });

    if (!menu) {
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
    const { name, description, isActive, fileUrl, fileType, flipbookId } = body;

    // Build update data object, only including fields that are provided
    const updateData: any = {
      name,
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
    };

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
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Menu deleted' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


