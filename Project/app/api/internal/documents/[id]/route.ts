import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { canEditDocument, canViewDocument, isRole } from '@/lib/auth/permissions';
import { documentMetaSchema, metaFromFormData } from '@/lib/document-schema';
import { deleteStoredFile, saveDocumentFile, UploadError } from '@/lib/storage';
import { sanitizeRichText } from '@/lib/sanitize';

type Ctx = { params: { id: string } };

// 404 (not 403) for documents the user may not see: do not reveal existence.
const NOT_FOUND = () => NextResponse.json({ error: 'Not found' }, { status: 404 });

export async function GET(_request: Request, { params }: Ctx) {
  const g = await apiGuard('documents.read');
  if (g.error) return g.error;

  const doc = await prisma.technicalDocument.findUnique({ where: { id: params.id } });
  if (!doc || !canViewDocument(g.user, doc)) return NOT_FOUND();
  if (!doc.isActive && !canEditDocument(g.user, doc)) return NOT_FOUND();

  await audit({ user: g.user, action: 'document.view', entity: 'document', entityId: doc.id });

  // Never expose the storage key.
  const { storageKey, ...safe } = doc;
  return NextResponse.json({ ...safe, hasFile: !!storageKey });
}

export async function PUT(request: Request, { params }: Ctx) {
  const g = await apiGuard('documents.write');
  if (g.error) return g.error;
  const { user } = g;

  const existing = await prisma.technicalDocument.findUnique({ where: { id: params.id } });
  if (!existing || !canViewDocument(user, existing)) return NOT_FOUND();
  if (!canEditDocument(user, existing)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }

  const parsed = documentMetaSchema.safeParse(metaFromFormData(fd));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' },
      { status: 400 }
    );
  }
  const meta = parsed.data;

  // A non-admin must not lock themselves out / widen beyond what they may edit
  // is handled by canEditDocument on the *existing* record above.

  let stored: Awaited<ReturnType<typeof saveDocumentFile>> | null = null;
  const file = fd.get('file');
  if (file instanceof File && file.size > 0) {
    try {
      stored = await saveDocumentFile(file);
    } catch (error) {
      if (error instanceof UploadError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }
  }

  await prisma.technicalDocument.update({
    where: { id: existing.id },
    data: {
      title: meta.title,
      category: meta.category,
      description: meta.description || null,
      content: meta.content ? sanitizeRichText(meta.content) : null,
      visibility: meta.visibility,
      departments: meta.visibility === 'DEPARTMENT' ? meta.departments : [],
      minRole: meta.visibility === 'ROLE_MIN' && isRole(meta.minRole) ? meta.minRole : null,
      isActive: meta.isActive,
      ...(stored
        ? {
            storageKey: stored.storageKey,
            mimeType: stored.mimeType,
            fileName: stored.fileName,
            fileSize: stored.fileSize,
            fileUrl: null,
          }
        : {}),
    },
  });
  if (stored) await deleteStoredFile(existing.storageKey);

  await audit({ user, action: 'document.update', entity: 'document', entityId: existing.id, meta: { title: meta.title, replacedFile: !!stored } });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const g = await apiGuard('documents.write');
  if (g.error) return g.error;
  const { user } = g;

  const existing = await prisma.technicalDocument.findUnique({ where: { id: params.id } });
  if (!existing || !canViewDocument(user, existing)) return NOT_FOUND();
  if (!canEditDocument(user, existing)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.technicalDocument.delete({ where: { id: existing.id } });
  await deleteStoredFile(existing.storageKey);
  await audit({ user, action: 'document.delete', entity: 'document', entityId: existing.id, meta: { title: existing.title } });
  return NextResponse.json({ success: true });
}
