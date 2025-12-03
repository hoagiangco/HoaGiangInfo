import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TechnicalDocumentForm from '@/components/TechnicalDocumentForm';

export default async function EditTechnicalDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const document = await prisma.technicalDocument.findUnique({
    where: { id: params.id },
  });

  if (!document) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa Document</h1>
      <TechnicalDocumentForm document={document} />
    </div>
  );
}







