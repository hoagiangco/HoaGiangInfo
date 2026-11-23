import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { RoomTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const room = await prisma.room.findUnique({
      where: { id: params.id },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
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
    const { number, type, description, translations, x, y, width, height } = body;

    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        number,
        type: type || 'standard',
        description,
        ...(translations !== undefined
          ? {
              translations: toPrismaTranslations<RoomTranslationFields>(translations, [
                'description',
              ]),
            }
          : {}),
        x: x ? parseFloat(x) : null,
        y: y ? parseFloat(y) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
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

    await prisma.room.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









