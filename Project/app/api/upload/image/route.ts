import { NextResponse } from 'next/server';
import { checkAdminSession } from '@/lib/admin-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { compressImage, getOptimizedFileName } from '@/lib/image-compression';

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    // Convert to proper Buffer type to avoid type issues
    const originalBuffer: Buffer = Buffer.from(new Uint8Array(bytes));

    // Compress image
    const compressedBuffer = await compressImage(originalBuffer, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      format: 'jpeg',
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename with optimized extension
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const optimizedFileName = getOptimizedFileName(sanitizedFileName, 'jpeg');
    const fileName = `${timestamp}-${optimizedFileName}`;
    const filePath = join(uploadsDir, fileName);
    const fileUrl = `/uploads/images/${fileName}`;

    // Save compressed file
    await writeFile(filePath, compressedBuffer);

    const originalSize = originalBuffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

    return NextResponse.json({
      url: fileUrl,
      fileName,
      size: compressedSize,
      originalSize,
      compressionRatio: `${compressionRatio}%`,
      type: 'image/jpeg',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


