import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import MenuListView, { type MenuListItem } from '@/components/MenuListView';
import { resolveMenuTranslations } from '@/lib/translations';

export default async function MenuPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'menu');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const menus = await prisma.menu.findMany({
    where: {
      isActive: true,
    },
    include: {
      items: {
        where: { isAvailable: true },
        select: { id: true },
      },
      flipbook: {
        select: { id: true, isActive: true, pages: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Batch-check active status for any EN/ZH flipbooks referenced in menu translations
  const resolvedList = menus.map((menu) => ({
    menu,
    resolved: resolveMenuTranslations(menu.description, menu.translations),
  }));

  const extraFlipbookIds = Array.from(
    new Set(
      resolvedList
        .flatMap(({ resolved }) => [
          resolved.translations.en?.flipbookId,
          resolved.translations.zh?.flipbookId,
        ])
        .filter((id): id is string => Boolean(id))
    )
  );

  const activeExtraFlipbooks = extraFlipbookIds.length
    ? await prisma.flipbook.findMany({
        where: { id: { in: extraFlipbookIds }, isActive: true },
        select: { id: true, pages: true },
      })
    : [];

  const activeExtraFlipbookIdSet = new Set(
    activeExtraFlipbooks
      .filter((fb) => fb.pages.length > 0)
      .map((fb) => fb.id)
  );

  const serializedMenus: MenuListItem[] = resolvedList
    .flatMap(({ menu, resolved }) => {
      const viFlipbookActive = Boolean(
        menu.flipbook && menu.flipbook.isActive && menu.flipbook.pages.length > 0
      );
      const enFlipbookId = resolved.translations.en?.flipbookId || null;
      const zhFlipbookId = resolved.translations.zh?.flipbookId || null;
      const enFlipbookActive = Boolean(
        enFlipbookId && activeExtraFlipbookIdSet.has(enFlipbookId)
      );
      const zhFlipbookActive = Boolean(
        zhFlipbookId && activeExtraFlipbookIdSet.has(zhFlipbookId)
      );

      const hasLinkedFlipbook = Boolean(
        menu.fileType === 'flipbook' ||
          menu.flipbookId ||
          enFlipbookId ||
          zhFlipbookId
      );
      const hasActiveFlipbook =
        viFlipbookActive || enFlipbookActive || zhFlipbookActive;
      const hasAnyFile = Boolean(
        menu.fileUrl ||
          resolved.translations.en?.fileUrl ||
          resolved.translations.zh?.fileUrl
      );

      // If this menu relies solely on Flipbook(s) and all of them are locked/unavailable, hide it from guests
      if (
        hasLinkedFlipbook &&
        !hasActiveFlipbook &&
        menu.items.length === 0 &&
        !hasAnyFile
      ) {
        return [];
      }

      // Strip locked flipbookIds from translations so language badges reflect only active resources
      const sanitizedTranslations = {
        ...(resolved.translations.en
          ? {
              en: {
                ...resolved.translations.en,
                flipbookId: enFlipbookActive ? enFlipbookId || undefined : undefined,
              },
            }
          : {}),
        ...(resolved.translations.zh
          ? {
              zh: {
                ...resolved.translations.zh,
                flipbookId: zhFlipbookActive ? zhFlipbookId || undefined : undefined,
              },
            }
          : {}),
      };

      return [
        {
          id: menu.id,
          name: menu.name,
          description: resolved.descriptionVi || null,
          translations: sanitizedTranslations,
          hasFlipbook: hasActiveFlipbook,
          itemsCount: menu.items.length,
        },
      ];
    });

  return <MenuListView token={params.token} menus={serializedMenus} />;
}
