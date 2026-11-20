import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import { audit } from '@/lib/auth/audit';
import { canEditDocument, canViewDocument } from '@/lib/auth/permissions';
import { DOC_CATEGORIES, VISIBILITY_LABELS } from '@/lib/documents';
import { sanitizeRichText } from '@/lib/sanitize';
import PDFViewer from '@/components/PDFViewer';
import DocumentForm from '@/components/DocumentForm';

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  const user = await requirePermission('documents.read');

  const doc = await prisma.technicalDocument.findUnique({ where: { id: params.id } });
  // Same 404 whether it doesn't exist or the user may not see it.
  if (!doc || !canViewDocument(user, doc)) notFound();
  const canEdit = canEditDocument(user, doc);
  if (!doc.isActive && !canEdit) notFound();

  const fileUrl = doc.storageKey ? `/api/internal/documents/${doc.id}/file` : null;

  if (searchParams.edit === '1' && canEdit) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa tài liệu</h1>
        <DocumentForm
          canDelete
          document={{
            id: doc.id,
            title: doc.title,
            category: doc.category,
            description: doc.description,
            content: doc.content,
            visibility: doc.visibility,
            departments: doc.departments,
            minRole: doc.minRole,
            isActive: doc.isActive,
            fileName: doc.fileName,
            hasFile: !!doc.storageKey,
          }}
        />
      </div>
    );
  }

  await audit({ user, action: 'document.view', entity: 'document', entityId: doc.id });

  const isPdf = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType?.startsWith('image/');

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">{DOC_CATEGORIES[doc.category] ?? doc.category} · {VISIBILITY_LABELS[doc.visibility]}</p>
          <h1 className="text-3xl font-bold text-gray-800">{doc.title}</h1>
        </div>
        {canEdit && (
          <a href={`/admin/documents/${doc.id}?edit=1`} className="bg-gray-700 text-white px-4 py-2 rounded-lg">Chỉnh sửa</a>
        )}
      </div>

      {doc.description && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-gray-700">{doc.description}</div>
      )}

      {doc.content && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeRichText(doc.content) }} />
        </div>
      )}

      {fileUrl && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tệp đính kèm</h2>
            <a href={`${fileUrl}?download=1`} className="text-primary-600 hover:underline">
              Tải xuống {doc.fileName}
            </a>
          </div>
          {isPdf && <PDFViewer fileUrl={fileUrl} fileName={doc.fileName || 'document.pdf'} />}
          {isImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt={doc.title} className="max-w-full rounded" />
          )}
        </div>
      )}
    </div>
  );
}
