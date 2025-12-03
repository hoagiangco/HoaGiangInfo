import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const floorPlan = await prisma.floorPlan.findUnique({
      where: { id: params.id },
      include: {
        rooms: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!floorPlan) {
      return NextResponse.json(
        { error: 'Floor plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error fetching floor plan:', error);
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
    const { name, description, imageUrl, fileType, isActive } = body;

    const floorPlan = await prisma.floorPlan.update({
      where: { id: params.id },
      data: {
        name,
        description,
        imageUrl,
        fileType,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error('Error updating floor plan:', error);
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

    await prisma.floorPlan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Floor plan deleted' });
  } catch (error) {
    console.error('Error deleting floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}






