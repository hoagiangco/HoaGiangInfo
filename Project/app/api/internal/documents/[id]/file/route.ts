import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { canViewDocument } from '@/lib/auth/permissions';
import { kindForMime, openStoredFile } from '@/lib/storage';

/**
 * The ONLY way to fetch an internal document file.
 * Requires a valid session + permission to view this specific document.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const g = await apiGuard('documents.read');
  if (g.error) return g.error;
  const { user } = g;

  const doc = await prisma.technicalDocument.findUnique({ where: { id: params.id } });
  if (!doc || !doc.storageKey || !canViewDocument(user, doc) || !doc.isActive) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let opened;
  try {
    opened = await openStoredFile(doc.storageKey);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const kind = kindForMime(doc.mimeType);
  const wantsDownload = new URL(request.url).searchParams.get('download') === '1';
  const inline = !!kind?.inline && !wantsDownload;
  const safeName = encodeURIComponent(doc.fileName || 'document');

  await audit({
    user,
    action: 'document.download',
    entity: 'document',
    entityId: doc.id,
    meta: { title: doc.title, inline },
  });

  const body = Readable.toWeb(opened.stream) as unknown as ReadableStream;
  return new NextResponse(body, {
    headers: {
      'Content-Type': kind?.mime ?? 'application/octet-stream',
      'Content-Length': String(opened.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${safeName}`,
      'X-Content-Type-Options': 'nosniff',
      // Inline types are only PDF/PNG/JPEG (never HTML/SVG), pinned by nosniff.
      ...(inline ? {} : { 'Content-Security-Policy': "default-src 'none'; sandbox" }),
      'Cache-Control': 'private, no-store',
    },
  });
}
