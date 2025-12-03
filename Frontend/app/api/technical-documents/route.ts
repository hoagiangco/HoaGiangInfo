import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { checkModuleAccess } from '@/lib/qr-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // Check if user has access to technical module
    if (token) {
      const hasAccess = await checkModuleAccess(token, 'technical');
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied to technical documents' },
          { status: 403 }
        );
      }
    } else {
      // If no token, check admin session
      const isAdmin = await checkAdminSession();
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const documents = await prisma.technicalDocument.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { title: 'asc' },
      ],
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching technical documents:', error);
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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const content = formData.get('content') as string;
    const file = formData.get('file') as File | null;

    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents');
      await mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      fileName = `${timestamp}-${file.name}`;
      fileUrl = `/uploads/documents/${fileName}`;
      fileSize = buffer.length;

      // Save file
      await writeFile(join(uploadsDir, fileName), buffer);
    }

    const document = await prisma.technicalDocument.create({
      data: {
        title,
        category,
        description,
        content,
        fileUrl,
        fileName,
        fileSize,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating technical document:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}







