import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { InformationTranslationFields } from '@/lib/translations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isAdmin = await checkAdminSession();
    const information = await prisma.information.findMany({
      where: isAdmin ? undefined : { isActive: true },
      include: {
        flipbook: true,
      },
      orderBy: { order: 'asc' },
    });
    const sanitized = isAdmin
      ? information
      : information.map((info) => ({
          ...info,
          flipbook: info.flipbook && info.flipbook.isActive ? info.flipbook : null,
        }));
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching information:', error);
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
    const {
      category,
      title,
      content,
      translations,
      fileUrl,
      fileType,
      flipbookId,
      icon,
      order,
      isActive,
    } = body;

    const information = await prisma.information.create({
      data: {
        category,
        title,
        content: content || '',
        translations: toPrismaTranslations<InformationTranslationFields>(
          translations,
          ['title', 'content', 'fileUrl', 'flipbookId']
        ),
        fileUrl: fileType === 'flipbook' ? null : fileUrl || null,
        fileType: fileType || null,
        flipbookId: fileType === 'flipbook' ? flipbookId || null : null,
        icon,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(information, { status: 201 });
  } catch (error) {
    console.error('Error creating information:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
