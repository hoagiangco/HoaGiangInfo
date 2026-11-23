import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { toPrismaTranslations } from '@/lib/prisma-json';
import type { ModuleTranslationFields } from '@/lib/translations';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const module = await prisma.module.findUnique({
      where: { id: params.id },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
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
    const { name, displayName, description, translations, icon, route, isPublic } = body;

    const module = await prisma.module.update({
      where: { id: params.id },
      data: {
        name,
        displayName,
        description,
        ...(translations !== undefined
          ? {
              translations: toPrismaTranslations<ModuleTranslationFields>(translations, [
                'displayName',
                'description',
              ]),
            }
          : {}),
        icon,
        route,
        isPublic: isPublic ?? false,
      },
    });

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
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
  const g = await apiGuard('content.manage');
  if (g.error) return g.error;

  try {
    const existing = await prisma.module.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy module' }, { status: 404 });
    }

    await prisma.module.delete({ where: { id: params.id } });
    await audit({
      user: g.user,
      action: 'module.delete',
      entity: 'module',
      entityId: params.id,
      meta: { name: existing.name, displayName: existing.displayName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { error: 'Không thể xóa module' },
      { status: 500 }
    );
  }
}










