import { NextResponse } from 'next/server';
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
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
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

      const arrayBuffer = await file.arrayBuffer();
      // Convert to proper Buffer type to avoid type issues
      const buffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));
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
        await writeFile(filePath, compressed);
        const fileUrl = `/uploads/flipbooks/${fileName}`;
        pageUrls.push(fileUrl);
      } else if (isPDF) {
        // Save PDF as is
        await writeFile(filePath, buffer);
        const fileUrl = `/uploads/flipbooks/${fileName}`;
        pageUrls.push(fileUrl);
      }
    }

    if (pageUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid files were uploaded' },
        { status: 400 }
      );
    }

    return NextResponse.json({ pages: pageUrls });
  } catch (error: any) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}







