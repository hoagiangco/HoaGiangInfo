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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa Service</h1>
      <ServiceForm service={service} />
    </div>
  );
}







