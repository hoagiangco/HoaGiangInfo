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
    const isPdfFile =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isValidType = file.type.startsWith('image/') || isPdfFile;

    if (!isValidType) {
      return NextResponse.json(
        { error: 'File must be an image or PDF' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 25MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    // Convert to proper Buffer type to avoid type issues
    const originalBuffer: Buffer = Buffer.from(new Uint8Array(bytes));

    // Only compress if it's an image (not PDF)
    let buffer: Buffer = originalBuffer;
    let fileName: string;
    let fileUrl: string;
    let finalSize = originalBuffer.length;
    let compressionRatio = '0%';

    if (file.type.startsWith('image/')) {
      // Compress image
      const compressed = await compressImage(originalBuffer, {
        maxWidth: 2560, // Larger for floor plans
        maxHeight: 2560,
        quality: 90, // Higher quality for floor plans
        format: 'jpeg',
      });
      buffer = compressed;

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
      type: file.type.startsWith('image/') ? 'image/jpeg' : (file.type || 'application/pdf'),
    });
  } catch (error) {
    console.error('Error uploading floor plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


