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
    include: {
      flipbook: true,
    },
  });

  if (!information) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Chỉnh Sửa Thông Tin</h1>
      <InformationForm information={information} />
    </div>
  );
}










