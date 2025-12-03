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

    // Validate file type (image or PDF)
    const isValidType =
      file.type.startsWith('image/') || file.type === 'application/pdf';

    if (!isValidType) {
      return NextResponse.json(
        { error: 'File must be an image or PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // Only compress if it's an image (not PDF)
    let buffer = originalBuffer;
    let fileName: string;
    let fileUrl: string;
    let finalSize = originalBuffer.length;
    let compressionRatio = '0%';

    if (file.type.startsWith('image/')) {
      // Compress image
      buffer = await compressImage(originalBuffer, {
        maxWidth: 2560, // Larger for floor plans
        maxHeight: 2560,
        quality: 90, // Higher quality for floor plans
        format: 'jpeg',
      });

      // Generate optimized filename
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const optimizedFileName = getOptimizedFileName(sanitizedFileName, 'jpeg');
      fileName = `floor-plan-${timestamp}-${optimizedFileName}`;
      
      finalSize = buffer.length;
      const originalSize = originalBuffer.length;
      compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(1);
    } else {
      // Keep PDF as is
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      fileName = `floor-plan-${timestamp}-${sanitizedFileName}`;
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'floor-plans');
    await mkdir(uploadsDir, { recursive: true });

    const filePath = join(uploadsDir, fileName);
    fileUrl = `/uploads/floor-plans/${fileName}`;

    // Save file
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: fileUrl,
      fileName,
      size: finalSize,
      originalSize: file.size,
      compressionRatio: file.type.startsWith('image/') ? `${compressionRatio}%` : 'N/A (PDF)',
      type: file.type.startsWith('image/') ? 'image/jpeg' : file.type,
    });
  } catch (error) {
    console.error('Error uploading floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


