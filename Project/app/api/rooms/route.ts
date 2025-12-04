import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const floorPlanId = searchParams.get('floorPlanId');

    const rooms = await prisma.room.findMany({
      where: floorPlanId ? { floorPlanId } : undefined,
      orderBy: { number: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
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
    const { floorPlanId, number, type, description, x, y, width, height } =
      body;

    const room = await prisma.room.create({
      data: {
        floorPlanId,
        number,
        type: type || 'standard',
        description,
        x: x ? parseFloat(x) : null,
        y: y ? parseFloat(y) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










