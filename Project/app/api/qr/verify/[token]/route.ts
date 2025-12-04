import { NextResponse } from 'next/server';
import { verifyQRToken } from '@/lib/qr-auth';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const qrInfo = await verifyQRToken(token);

    if (!qrInfo) {
      return NextResponse.json(
        { error: 'Invalid or inactive QR code' },
        { status: 404 }
      );
    }

    return NextResponse.json(qrInfo);
  } catch (error) {
    console.error('Error in QR verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










