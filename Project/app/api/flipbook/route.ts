import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { FlipbookTranslationFields } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const flipbook = await prisma.flipbook.findUnique({
        where: { id },
      });

      if (!flipbook || (!isAdmin && !flipbook.isActive)) {
        return NextResponse.json({ error: 'Flipbook not found' }, { status: 404 });
      }

      return NextResponse.json(flipbook);
    }

    const flipbooks = await prisma.flipbook.findMany({
      where: isAdmin ? undefined : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(flipbooks);
  } catch (error) {
    console.error('Error fetching flipbooks:', error);
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
    const { name, description, translations, pages, isActive } = body;

    if (!name || !pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'Name and pages (array of image URLs) are required' },
        { status: 400 }
      );
    }

    const flipbook = await prisma.flipbook.create({
      data: {
        name,
        description: description || null,
        translations: toPrismaTranslations<FlipbookTranslationFields>(translations, [
          'name',
          'description',
        ]),
        pages,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(flipbook, { status: 201 });
  } catch (error) {
    console.error('Error creating flipbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}









