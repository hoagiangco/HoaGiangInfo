import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import InformationForm from '@/components/InformationForm';

export default async function EditInformationPage({
  params,
}: {
  params: { id: string };
}) {
  const information = await prisma.information.findUnique({
    where: { id: params.id },
  });

  if (!information) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa Information</h1>
      <InformationForm information={information} />
    </div>
  );
}







