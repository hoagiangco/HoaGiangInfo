import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default async function EditModulePage({
  params,
}: {
  params: { id: string };
}) {
  const module = await prisma.module.findUnique({
    where: { id: params.id },
  });

  if (!module) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Chỉnh sửa Module
      </h1>
      <ModuleForm module={module} />
    </div>
  );
}







