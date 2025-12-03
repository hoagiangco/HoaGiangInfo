import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TechnicalDocumentsPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'technical');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const documents = await prisma.technicalDocument.findMany({
    where: { isActive: true },
    orderBy: [
      { category: 'asc' },
      { title: 'asc' },
    ],
  });

  // Group by category
  const documentsByCategory: Record<
    string,
    typeof documents
  > = {};
  documents.forEach((doc) => {
    if (!documentsByCategory[doc.category]) {
      documentsByCategory[doc.category] = [];
    }
    documentsByCategory[doc.category].push(doc);
  });

  const categoryLabels: Record<string, string> = {
    maintenance: 'Bảo Trì',
    cleaning: 'Vệ Sinh',
    safety: 'An Toàn',
    equipment: 'Thiết Bị',
    procedures: 'Quy Trình',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tài Liệu</h1>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">📭</span>
            <span>Chưa có tài liệu nào</span>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(documentsByCategory).map(([category, docs]) => (
            <div key={category} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                {categoryLabels[category] || category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/${params.token}/technical/${doc.id}`}
                  >
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 hover:shadow-md transition-all cursor-pointer">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {doc.title}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {doc.description}
                        </p>
                      )}
                      {doc.fileUrl && (
                        <div className="flex items-center text-sm text-primary-600">
                          <span>📄 PDF Document</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


