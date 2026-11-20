import { NextResponse } from 'next/server';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

const ALLOWED_BUCKETS = new Set(['flipbooks', 'floor-plans', 'images']);

const MIME_BY_EXT: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function resolveSafeUploadPath(segments: string[]): {
  filePath: string;
  mimeType: string;
} | null {
  if (!segments || segments.length < 2) return null;

  const [bucket, ...rest] = segments;
  if (!ALLOWED_BUCKETS.has(bucket)) return null;

  for (const seg of rest) {
    if (!seg || seg === '.' || seg === '..' || seg.includes('/') || seg.includes('\\') || seg.includes('\0')) {
      return null;
    }
  }

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const bucketRoot = path.resolve(uploadsRoot, bucket);
  const resolved = path.resolve(bucketRoot, ...rest);

  if (!resolved.startsWith(bucketRoot + path.sep)) {
    return null;
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    return null;
  }

  return { filePath: resolved, mimeType };
}

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] };
};

export async function GET(request: Request, { params }: RouteContext) {
  const { path: segments } = await params;
  const resolved = resolveSafeUploadPath(segments);
  if (!resolved) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const fileStats = await stat(resolved.filePath);
    if (!fileStats.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const totalSize = fileStats.size;
    const rangeHeader = request.headers.get('range');

    const baseHeaders: Record<string, string> = {
      'Content-Type': resolved.mimeType,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
    };

    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;

        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= totalSize) {
          return new NextResponse(null, {
            status: 416,
            headers: {
              'Content-Range': `bytes */${totalSize}`,
            },
          });
        }

        const chunkSize = end - start + 1;
        const stream = createReadStream(resolved.filePath, { start, end });
        const body = Readable.toWeb(stream) as unknown as ReadableStream;

        return new NextResponse(body, {
          status: 206,
          headers: {
            ...baseHeaders,
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': String(chunkSize),
          },
        });
      }
    }

    const stream = createReadStream(resolved.filePath);
    const body = Readable.toWeb(stream) as unknown as ReadableStream;

    return new NextResponse(body, {
      status: 200,
      headers: {
        ...baseHeaders,
        'Content-Length': String(totalSize),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function HEAD(request: Request, { params }: RouteContext) {
  const { path: segments } = await params;
  const resolved = resolveSafeUploadPath(segments);
  if (!resolved) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const fileStats = await stat(resolved.filePath);
    if (!fileStats.isFile()) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': resolved.mimeType,
        'Content-Length': String(fileStats.size),
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
