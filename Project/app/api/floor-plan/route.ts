import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { FloorPlanTranslationFields } from '@/lib/translations';

export async function GET() {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: { isActive: true },
      include: {
        rooms: {
          orderBy: { number: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(floorPlans);
  } catch (error) {
    console.error('Error fetching floor plans:', error);
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
    const { name, description, translations, imageUrl, fileType, isActive } = body;

    const floorPlan = await prisma.floorPlan.create({
      data: {
        name,
        description,
        translations: toPrismaTranslations<FloorPlanTranslationFields>(translations, [
          'name',
          'description',
          'imageUrl',
          'fileType',
        ]),
        imageUrl,
        fileType,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(floorPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










