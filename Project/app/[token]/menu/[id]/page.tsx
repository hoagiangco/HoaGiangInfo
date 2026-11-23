import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MenuDetailView from '@/components/MenuDetailView';
import { resolveMenuTranslations } from '@/lib/translations';

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
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      },
      flipbook: true,
    },
  });

  if (!menu) {
    notFound();
  }

  const resolved = resolveMenuTranslations(menu.description, menu.translations);
  const flipbookEnId = resolved.translations.en?.flipbookId || null;
  const flipbookZhId = resolved.translations.zh?.flipbookId || null;

  const extraFlipbookIds = Array.from(
    new Set([flipbookEnId, flipbookZhId].filter(Boolean) as string[])
  );

  const extraFlipbooks = extraFlipbookIds.length
    ? await prisma.flipbook.findMany({
        where: { id: { in: extraFlipbookIds }, isActive: true },
        select: { id: true, name: true, pages: true },
      })
    : [];

  const flipbookMap = new Map(
    extraFlipbooks
      .filter((fb) => fb.pages.length > 0)
      .map((fb) => [fb.id, fb])
  );

  const activeViFlipbook =
    menu.flipbook && menu.flipbook.isActive && menu.flipbook.pages.length > 0
      ? {
          id: menu.flipbook.id,
          name: menu.flipbook.name,
          pages: menu.flipbook.pages,
        }
      : null;
  const activeEnFlipbook = flipbookEnId
    ? flipbookMap.get(flipbookEnId) ?? null
    : null;
  const activeZhFlipbook = flipbookZhId
    ? flipbookMap.get(flipbookZhId) ?? null
    : null;

  const hasLinkedFlipbook = Boolean(
    menu.fileType === 'flipbook' ||
      menu.flipbookId ||
      flipbookEnId ||
      flipbookZhId
  );
  const hasActiveFlipbook = Boolean(
    activeViFlipbook || activeEnFlipbook || activeZhFlipbook
  );
  const hasAnyFile = Boolean(
    menu.fileUrl ||
      resolved.translations.en?.fileUrl ||
      resolved.translations.zh?.fileUrl
  );

  // If this menu relies solely on Flipbook(s) and all of them are locked/unavailable, do not expose it
  if (
    hasLinkedFlipbook &&
    !hasActiveFlipbook &&
    menu.items.length === 0 &&
    !hasAnyFile
  ) {
    notFound();
  }

  const enrichedMenu = {
    id: menu.id,
    name: menu.name,
    description: resolved.descriptionVi || null,
    translations: resolved.translations,
    fileUrl: menu.fileUrl,
    fileType: hasActiveFlipbook ? menu.fileType : menu.fileType === 'flipbook' ? null : menu.fileType,
    flipbookId: activeViFlipbook ? menu.flipbookId : null,
    flipbook: activeViFlipbook,
    flipbooksByLang: {
      en: activeEnFlipbook,
      zh: activeZhFlipbook,
    },
    items: menu.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      translations: item.translations,
      price: item.price,
      image: item.image,
      category: item.category,
      isAvailable: item.isAvailable,
    })),
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
      <MenuDetailView menu={enrichedMenu} token={params.token} />
    </div>
  );
}
