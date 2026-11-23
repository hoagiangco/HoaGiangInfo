import { NextResponse } from 'next/server';
import sharp from 'sharp';
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

    const { searchParams } = new URL(request.url);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose =
      (formData.get('purpose') as string | null) || searchParams.get('purpose');
    const isLogo = purpose === 'logo';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (block SVG to prevent stored XSS via uploaded images)
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return NextResponse.json(
        { error: 'Chỉ hỗ trợ định dạng ảnh PNG, JPG hoặc WebP' },
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
    const originalBuffer: Buffer = Buffer.from(new Uint8Array(bytes));

    // Detect transparency/format so PNG & WebP logos keep crisp transparent backgrounds
    let outputFormat: 'jpeg' | 'webp' | 'png' = 'jpeg';
    try {
      const meta = await sharp(originalBuffer).metadata();
      if (meta.format === 'png' && (meta.hasAlpha || isLogo)) {
        outputFormat = 'png';
      } else if (meta.format === 'webp') {
        outputFormat = 'webp';
      } else if (isLogo && meta.hasAlpha) {
        outputFormat = 'png';
      }
    } catch {
      if (file.type === 'image/png') outputFormat = 'png';
      else if (file.type === 'image/webp') outputFormat = 'webp';
    }

    const compressedBuffer = await compressImage(originalBuffer, {
      maxWidth: isLogo ? 512 : 1920,
      maxHeight: isLogo ? 512 : 1920,
      quality: isLogo ? 92 : 85,
      format: outputFormat,
    });

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images');
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const optimizedFileName = getOptimizedFileName(sanitizedFileName, outputFormat);
    const prefix = isLogo ? `logo-${timestamp}` : `${timestamp}`;
    const fileName = `${prefix}-${optimizedFileName}`;
    const filePath = join(uploadsDir, fileName);
    const fileUrl = `/uploads/images/${fileName}`;

    await writeFile(filePath, compressedBuffer);

    const originalSize = originalBuffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    const mimeType =
      outputFormat === 'png'
        ? 'image/png'
        : outputFormat === 'webp'
        ? 'image/webp'
        : 'image/jpeg';

    return NextResponse.json({
      url: fileUrl,
      fileName,
      size: compressedSize,
      originalSize,
      compressionRatio: `${compressionRatio}%`,
      type: mimeType,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
