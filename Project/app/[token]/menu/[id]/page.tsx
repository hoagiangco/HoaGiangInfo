import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuDetailView from '@/components/MenuDetailView';
import { parseMenuBilingual } from '@/lib/bilingual-menu';

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

  const bilingual = parseMenuBilingual(menu.description);
  let flipbookEn: { id: string; name: string; pages: string[] } | null = null;

  if (bilingual.flipbookEnId) {
    flipbookEn = await prisma.flipbook.findUnique({
      where: { id: bilingual.flipbookEnId },
      select: { id: true, name: true, pages: true },
    });
  }

  const enrichedMenu = {
    ...menu,
    description: bilingual.descriptionVi || null,
    nameEn: bilingual.nameEn || null,
    descriptionEn: bilingual.descriptionEn || null,
    fileUrlEn: bilingual.fileUrlEn || null,
    flipbookEn,
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
      <MenuDetailView menu={enrichedMenu} token={params.token} />
    </div>
  );
}
