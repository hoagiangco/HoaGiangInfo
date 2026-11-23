import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MenuForm from '@/components/MenuForm';

export default async function EditMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const menu = await prisma.menu.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { category: 'asc' },
      },
      flipbook: true,
    },
  });

  if (!menu) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Chỉnh Sửa Thực Đơn</h1>
      <MenuForm menu={menu} />
    </div>
  );
}


