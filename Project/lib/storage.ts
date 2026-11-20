import 'server-only';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { mkdir, stat, unlink, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Private file storage for internal documents.
 * Lives OUTSIDE public/ so files can only be fetched through
 * /api/internal/documents/[id]/file (which checks the session + permissions).
 *
 * Set STORAGE_DIR to an absolute path in production (ideally outside the
 * app directory, with backups). To move to S3/MinIO later, only this file
 * needs to change.
 */

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB

export function storageRoot(): string {
  return process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR)
    : path.join(process.cwd(), 'storage');
}

interface FileKind {
  ext: string;
  mime: string;
  inline: boolean;
  check: (b: Buffer) => boolean;
}

const startsWith = (b: Buffer, sig: number[]) =>
  b.length >= sig.length && sig.every((v, i) => b[i] === v);

const KINDS: FileKind[] = [
  { ext: 'pdf', mime: 'application/pdf', inline: true, check: (b) => startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d]) },
  { ext: 'png', mime: 'image/png', inline: true, check: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47]) },
  { ext: 'jpg', mime: 'image/jpeg', inline: true, check: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  { ext: 'jpeg', mime: 'image/jpeg', inline: true, check: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  // OOXML files are ZIP containers
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', inline: false, check: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', inline: false, check: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', inline: false, check: (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]) },
];

export const ALLOWED_EXTENSIONS = KINDS.map((k) => k.ext);

export function kindForExt(ext: string): FileKind | undefined {
  return KINDS.find((k) => k.ext === ext.toLowerCase());
}

export function kindForMime(mime: string | null | undefined): FileKind | undefined {
  return KINDS.find((k) => k.mime === mime);
}

export class UploadError extends Error {}

/** Validates (extension allow-list + magic bytes + size) and stores the file. */
export async function saveDocumentFile(file: File): Promise<{
  storageKey: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}> {
  if (file.size === 0) throw new UploadError('File rỗng');
  if (file.size > MAX_DOCUMENT_SIZE) {
    throw new UploadError('File vượt quá 25MB');
  }

  const ext = path.extname(file.name).replace('.', '').toLowerCase();
  const kind = kindForExt(ext);
  if (!kind) {
    throw new UploadError(
      `Định dạng không được hỗ trợ. Cho phép: ${ALLOWED_EXTENSIONS.join(', ')}`
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!kind.check(buffer)) {
    throw new UploadError('Nội dung file không khớp với định dạng');
  }

  // Random server-side name: the user-supplied name is never used on disk.
  const storageKey = `${randomUUID()}.${kind.ext}`;
  const dir = storageRoot();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storageKey), buffer);

  // Keep a display name only (no path components, bounded length).
  const fileName = path.basename(file.name).replace(/[\r\n"]/g, '_').slice(0, 200);

  return { storageKey, mimeType: kind.mime, fileName, fileSize: buffer.length };
}

const KEY_RE = /^[0-9a-f-]{36}\.[a-z]{3,4}$/;

function resolveKey(storageKey: string): string {
  if (!KEY_RE.test(storageKey)) throw new Error('Invalid storage key');
  return path.join(storageRoot(), storageKey);
}

export async function deleteStoredFile(storageKey: string | null | undefined) {
  if (!storageKey) return;
  try {
    await unlink(resolveKey(storageKey));
  } catch {
    // already gone
  }
}

export async function openStoredFile(storageKey: string) {
  const full = resolveKey(storageKey);
  const info = await stat(full);
  return { stream: createReadStream(full), size: info.size };
}

/** Used by the migration script to move a legacy file into private storage. */
export async function adoptFile(buffer: Buffer, ext: string): Promise<string> {
  const storageKey = `${randomUUID()}.${ext}`;
  await mkdir(storageRoot(), { recursive: true });
  await writeFile(path.join(storageRoot(), storageKey), buffer);
  return storageKey;
}
