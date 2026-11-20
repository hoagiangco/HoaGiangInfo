import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    if (!rateLimit(`scanapi:${getClientIp(request.headers)}`, 30, 60 * 1000).ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { token },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'Invalid QR code' },
        { status: 404 }
      );
    }

    // Get IP and user agent
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for') ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Record scan
    await prisma.qRCodeScan.create({
      data: {
        qrCodeId: qrCode.id,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










