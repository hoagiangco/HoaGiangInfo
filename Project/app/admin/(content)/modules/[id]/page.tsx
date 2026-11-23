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
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">
        Chỉnh Sửa Phân Hệ
      </h1>
      <ModuleForm module={module} />
    </div>
  );
}










