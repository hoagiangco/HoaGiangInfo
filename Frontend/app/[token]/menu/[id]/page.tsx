import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuDetailView from '@/components/MenuDetailView';

export default async function MenuDetailPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'menu');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const menu = await prisma.menu.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' },
        ],
      },
      flipbook: true,
    },
  });

  if (!menu) {
    notFound();
  }

  return (
    <div className="-mt-2">
      <MenuDetailView menu={menu} />
    </div>
  );
}

