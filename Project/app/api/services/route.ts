import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { ServiceTranslationFields } from '@/lib/translations';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
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
    const { name, type, description, translations, images, hours, location, isActive } = body;

    const service = await prisma.service.create({
      data: {
        name,
        type,
        description,
        translations: toPrismaTranslations<ServiceTranslationFields>(translations, [
          'name',
          'description',
          'hours',
          'location',
        ]),
        images: images || [],
        hours,
        location,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

