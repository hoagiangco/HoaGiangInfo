/**
 * One-off migration: moves legacy internal documents out of public/uploads/documents
 * (anyone could download them by URL) into private storage, and fills the new
 * columns on TechnicalDocument.
 *
 *   npm run docs:migrate
 *
 * Idempotent. Legacy files are deleted from public/ after being copied.
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

const storageRoot = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), 'storage');

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

async function main() {
  const docs = await prisma.technicalDocument.findMany({
    where: { fileUrl: { startsWith: '/uploads/documents/' }, storageKey: null },
  });
  console.log(`Found ${docs.length} legacy document file(s).`);
  await mkdir(storageRoot, { recursive: true });

  for (const doc of docs) {
    const rel = doc.fileUrl!.replace(/^\/+/, '');
    const abs = path.join(process.cwd(), 'public', rel);
    const ext = path.extname(abs).replace('.', '').toLowerCase();

    if (!MIME[ext]) {
      console.warn(`SKIP ${doc.id}: unsupported extension .${ext}`);
      continue;
    }

    let buf: Buffer;
    try {
      buf = await readFile(abs);
    } catch {
      console.warn(`SKIP ${doc.id}: file missing on disk (${abs})`);
      continue;
    }

    const storageKey = `${randomUUID()}.${ext}`;
    await writeFile(path.join(storageRoot, storageKey), buf);
    await prisma.technicalDocument.update({
      where: { id: doc.id },
      data: {
        storageKey,
        mimeType: MIME[ext],
        fileSize: buf.length,
        fileUrl: null,
        visibility: 'ALL_STAFF',
      },
    });
    await unlink(abs).catch(() => {});
    console.log(`OK   ${doc.id}: ${doc.title}`);
  }
  console.log('Done. Storage directory:', storageRoot);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
