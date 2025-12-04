import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const qrCodes = await prisma.qRCode.findMany({
      include: {
        modules: {
          include: {
            module: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(qrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
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
    const { name, token, description, type, isActive } = body;

    const qrCode = await prisma.qRCode.create({
      data: {
        name,
        token,
        description,
        type: type || 'custom',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(qrCode, { status: 201 });
  } catch (error) {
    console.error('Error creating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










