import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { displayName: 'asc' },
    });
    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
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
    const { name, displayName, description, icon, route, isPublic } = body;

    const module = await prisma.module.create({
      data: {
        name,
        displayName,
        description,
        icon,
        route,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










