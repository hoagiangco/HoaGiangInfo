import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminSession } from '@/lib/admin-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { compressImage } from '@/lib/image-compression';

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;
    const files = formData.getAll('files') as File[];

    if (!name || files.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one file are required' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'flipbooks');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const pageUrls: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPDF = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');

      if (!isPDF && !isImage) {
        continue; // Skip unsupported files
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const extension = isPDF ? 'pdf' : file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${i + 1}.${extension}`;
      const filePath = join(uploadsDir, fileName);

      if (isImage) {
        // Compress image
        const compressed = await compressImage(buffer, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 85,
        });
        await writeFile(filePath, compressed.buffer);
        const fileUrl = `/uploads/flipbooks/${fileName}`;
        pageUrls.push(fileUrl);
      } else if (isPDF) {
        // For PDF, we'll save it and note that it needs client-side rendering
        // In a production environment, you might want to convert PDF to images server-side
        // For now, we'll save the PDF and let the client handle rendering
        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/flipbooks/${fileName}`;
        pageUrls.push(fileUrl);
        // Note: PDF files in flipbook will need special handling in the viewer
      }
    }

    if (pageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded' },
        { status: 400 }
      );
    }

    // Create flipbook in database
    const flipbook = await prisma.flipbook.create({
      data: {
        name,
        description: description || null,
        pages: pageUrls,
      },
    });

    return NextResponse.json(flipbook, { status: 201 });
  } catch (error: any) {
    console.error('Error creating flipbook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

