import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import PDFViewer from '@/components/PDFViewer';

export default async function TechnicalDocumentPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'technical');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const document = await prisma.technicalDocument.findUnique({
    where: { id: params.id },
  });

  if (!document || !document.isActive) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{document.title}</h1>

      {document.description && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700">{document.description}</p>
        </div>
      )}

      {document.content && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>
      )}

      {document.fileUrl && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Tài Liệu PDF
          </h2>
          <PDFViewer fileUrl={document.fileUrl} fileName={document.fileName || 'document.pdf'} />
        </div>
      )}
    </div>
  );
}







