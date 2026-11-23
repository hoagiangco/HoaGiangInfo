import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ServiceForm from '@/components/ServiceForm';

export default async function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
  const service = await prisma.service.findUnique({
    where: { id: params.id },
  });

  if (!service) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Chỉnh Sửa Dịch Vụ</h1>
      <ServiceForm service={service} />
    </div>
  );
}










