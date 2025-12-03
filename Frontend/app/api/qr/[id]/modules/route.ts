import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const modules = await prisma.qRModule.findMany({
      where: { qrCodeId: params.id },
      include: {
        module: true,
      },
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching QR modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId } = body;

    const qrModule = await prisma.qRModule.create({
      data: {
        qrCodeId: params.id,
        moduleId,
      },
      include: {
        module: true,
      },
    });

    return NextResponse.json(qrModule, { status: 201 });
  } catch (error) {
    console.error('Error assigning module:', error);
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

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'moduleId is required' },
        { status: 400 }
      );
    }

    await prisma.qRModule.delete({
      where: {
        qrCodeId_moduleId: {
          qrCodeId: params.id,
          moduleId,
        },
      },
    });

    return NextResponse.json({ message: 'Module removed from QR code' });
  } catch (error) {
    console.error('Error removing module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







