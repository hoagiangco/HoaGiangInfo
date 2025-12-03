import sharp from 'sharp';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

/**
 * Compress and optimize image
 * @param buffer - Image buffer
 * @param options - Compression options
 * @returns Compressed image buffer
 */
export async function compressImage(
  buffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = 'jpeg',
  } = options;

  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Determine output format
    let outputFormat: 'jpeg' | 'webp' | 'png' = format;
    
    // If original is PNG and has transparency, keep as PNG
    if (metadata.format === 'png' && metadata.hasAlpha) {
      outputFormat = 'png';
    } else if (format === 'webp' || metadata.format === 'webp') {
      outputFormat = 'webp';
    } else {
      outputFormat = 'jpeg';
    }

    // Resize if needed
    let processedImage = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Apply compression based on format
    if (outputFormat === 'jpeg') {
      processedImage = processedImage.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
    } else if (outputFormat === 'webp') {
      processedImage = processedImage.webp({
        quality,
        effort: 6,
      });
    } else if (outputFormat === 'png') {
      processedImage = processedImage.png({
        quality,
        compressionLevel: 9,
        adaptiveFiltering: true,
      });
    }

    return await processedImage.toBuffer();
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original buffer if compression fails
    return buffer;
  }
}

/**
 * Get optimized file name with new extension
 */
export function getOptimizedFileName(
  originalFileName: string,
  format: 'jpeg' | 'webp' | 'png' = 'jpeg'
): string {
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  const extension = format === 'webp' ? 'webp' : format === 'png' ? 'png' : 'jpg';
  return `${nameWithoutExt}.${extension}`;
}






