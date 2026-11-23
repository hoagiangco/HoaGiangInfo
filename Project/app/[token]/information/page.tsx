import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import {
  countHtmlTableRows,
  hasHtmlTable,
  isQuickInfoContent,
  sanitizeRichText,
  stripHtmlToText,
} from '@/lib/sanitize';
import {
  getAvailableLanguages,
  getLocalizedValue,
  parseTranslations,
  type InformationTranslationFields,
} from '@/lib/translations';
import InformationListView, {
  type InformationListItem,
} from '@/components/InformationListView';

export default async function InformationPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'information');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const information = await prisma.information.findMany({
    where: { isActive: true },
    include: {
      flipbook: {
        select: { id: true, isActive: true, pages: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  // Batch-check active status for any EN/ZH flipbooks referenced in information translations
  const parsedList = information.map((info) => ({
    info,
    parsed: parseTranslations<InformationTranslationFields>(info.translations),
  }));

  const extraFlipbookIds = Array.from(
    new Set(
      parsedList
        .flatMap(({ parsed }) => [parsed.en?.flipbookId, parsed.zh?.flipbookId])
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

  const items: InformationListItem[] = parsedList.flatMap(({ info, parsed }) => {
    const contentVi = getLocalizedValue<InformationTranslationFields>(
      'vi',
      info.content,
      info.translations,
      'content'
    );
    const contentEn = getLocalizedValue<InformationTranslationFields>(
      'en',
      info.content,
      info.translations,
      'content'
    );
    const contentZh = getLocalizedValue<InformationTranslationFields>(
      'zh',
      info.content,
      info.translations,
      'content'
    );

    const viFlipbookActive = Boolean(
      info.flipbook && info.flipbook.isActive && info.flipbook.pages.length > 0
    );
    const enFlipbookId = parsed.en?.flipbookId || null;
    const zhFlipbookId = parsed.zh?.flipbookId || null;
    const enFlipbookActive = Boolean(
      enFlipbookId && activeExtraFlipbookIdSet.has(enFlipbookId)
    );
    const zhFlipbookActive = Boolean(
      zhFlipbookId && activeExtraFlipbookIdSet.has(zhFlipbookId)
    );

    const hasLinkedFlipbook = Boolean(
      info.fileType === 'flipbook' ||
        info.flipbookId ||
        enFlipbookId ||
        zhFlipbookId
    );
    const hasFlipbook =
      viFlipbookActive || enFlipbookActive || zhFlipbookActive;
    const hasFile = Boolean(
      info.fileUrl || parsed.en?.fileUrl || parsed.zh?.fileUrl
    );
    const hasTextContent = Boolean(
      stripHtmlToText(contentVi) ||
        stripHtmlToText(contentEn) ||
        stripHtmlToText(contentZh)
    );

    // If this info item relies solely on Flipbook(s) and all are locked/unavailable, hide it from guests
    if (hasLinkedFlipbook && !hasFlipbook && !hasTextContent && !hasFile) {
      return [];
    }

    const hasAttachment = hasFlipbook || hasFile;

    let attachmentType: 'flipbook' | 'pdf' | 'image' | null = null;
    if (hasFlipbook && (info.fileType === 'flipbook' || !hasFile)) {
      attachmentType = 'flipbook';
    } else if (hasFile) {
      const sampleUrl =
        info.fileUrl || parsed.en?.fileUrl || parsed.zh?.fileUrl || '';
      attachmentType =
        info.fileType === 'pdf' || sampleUrl.toLowerCase().endsWith('.pdf')
          ? 'pdf'
          : 'image';
    }

    const hasTable =
      hasHtmlTable(contentVi) ||
      hasHtmlTable(contentEn) ||
      hasHtmlTable(contentZh);
    const tableRowCount = Math.max(
      countHtmlTableRows(contentVi),
      countHtmlTableRows(contentEn),
      countHtmlTableRows(contentZh)
    );

    const isQuick = isQuickInfoContent({
      html: contentVi,
      hasAttachment,
    });

    const sanitizedVi = sanitizeRichText(contentVi);
    const sanitizedEn = sanitizeRichText(contentEn);
    const sanitizedZh = sanitizeRichText(contentZh);

    const makePreview = (html: string) => {
      if (hasHtmlTable(html)) {
        // Extract non-table text if any, otherwise let UI show clean table summary
        const withoutTable = html.replace(/<table[\s\S]*?<\/table>/gi, ' ');
        const text = stripHtmlToText(withoutTable);
        return text.length > 10 ? text.slice(0, 160) : '';
      }
      return stripHtmlToText(html).slice(0, 180);
    };

    const sanitizedTranslations = {
      ...(parsed.en
        ? {
            en: {
              ...parsed.en,
              flipbookId: enFlipbookActive ? enFlipbookId || undefined : undefined,
            },
          }
        : {}),
      ...(parsed.zh
        ? {
            zh: {
              ...parsed.zh,
              flipbookId: zhFlipbookActive ? zhFlipbookId || undefined : undefined,
            },
          }
        : {}),
    };

    const availableLangs = getAvailableLanguages<InformationTranslationFields>(
      sanitizedTranslations,
      ['title', 'content', 'fileUrl', 'flipbookId']
    );

    return [
      {
        id: info.id,
        category: info.category,
        icon: info.icon,
        isQuick,
        hasTable,
        tableRowCount,
        attachmentType,
        availableLangs,
        titles: {
          vi: getLocalizedValue<InformationTranslationFields>(
            'vi',
            info.title,
            info.translations,
            'title'
          ),
          en: getLocalizedValue<InformationTranslationFields>(
            'en',
            info.title,
            info.translations,
            'title'
          ),
          zh: getLocalizedValue<InformationTranslationFields>(
            'zh',
            info.title,
            info.translations,
            'title'
          ),
        },
        sanitizedContents: {
          vi: sanitizedVi,
          en: sanitizedEn,
          zh: sanitizedZh,
        },
        plainTexts: {
          vi: stripHtmlToText(contentVi),
          en: stripHtmlToText(contentEn),
          zh: stripHtmlToText(contentZh),
        },
        previews: {
          vi: makePreview(contentVi),
          en: makePreview(contentEn),
          zh: makePreview(contentZh),
        },
      },
    ];
  });

  return <InformationListView token={params.token} items={items} />;
}
