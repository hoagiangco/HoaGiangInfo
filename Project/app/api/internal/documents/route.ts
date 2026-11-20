import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiGuard } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { documentVisibilityWhere } from '@/lib/documents';
import { documentMetaSchema, metaFromFormData } from '@/lib/document-schema';
import { saveDocumentFile, UploadError } from '@/lib/storage';
import { sanitizeRichText } from '@/lib/sanitize';
import { isRole } from '@/lib/auth/permissions';

export async function GET() {
  const g = await apiGuard('documents.read');
  if (g.error) return g.error;

  const documents = await prisma.technicalDocument.findMany({
    where: { isActive: true, ...documentVisibilityWhere(g.user) },
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      visibility: true,
      updatedAt: true,
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const g = await apiGuard('documents.write');
  if (g.error) return g.error;
  const { user } = g;

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

  const file = fd.get('file');
  let stored: Awaited<ReturnType<typeof saveDocumentFile>> | null = null;
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

  const document = await prisma.technicalDocument.create({
    data: {
      title: meta.title,
      category: meta.category,
      description: meta.description || null,
      content: meta.content ? sanitizeRichText(meta.content) : null,
      visibility: meta.visibility,
      departments: meta.visibility === 'DEPARTMENT' ? meta.departments : [],
      minRole: meta.visibility === 'ROLE_MIN' && isRole(meta.minRole) ? meta.minRole : null,
      isActive: meta.isActive,
      uploadedById: user.id,
      storageKey: stored?.storageKey ?? null,
      mimeType: stored?.mimeType ?? null,
      fileName: stored?.fileName ?? null,
      fileSize: stored?.fileSize ?? null,
    },
  });

  await audit({ user, action: 'document.create', entity: 'document', entityId: document.id, meta: { title: document.title } });
  return NextResponse.json({ id: document.id }, { status: 201 });
}
