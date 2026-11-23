import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { hasHtmlTable, sanitizeRichText, stripHtmlToText } from '@/lib/sanitize';
import {
  getLocalizedValue,
  parseTranslations,
  type InformationTranslationFields,
} from '@/lib/translations';
import InformationDetailView from '@/components/InformationDetailView';

export default async function InformationDetailPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'information');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const info = await prisma.information.findUnique({
    where: { id: params.id, isActive: true },
    include: {
      flipbook: true,
    },
  });

  if (!info) {
    notFound();
  }

  const parsed = parseTranslations<InformationTranslationFields>(
    info.translations
  );
  const flipbookEnId = parsed.en?.flipbookId || null;
  const flipbookZhId = parsed.zh?.flipbookId || null;

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
    info.flipbook && info.flipbook.isActive && info.flipbook.pages.length > 0
      ? {
          id: info.flipbook.id,
          name: info.flipbook.name,
          pages: info.flipbook.pages,
        }
      : null;
  const activeEnFlipbook = flipbookEnId
    ? flipbookMap.get(flipbookEnId) ?? null
    : null;
  const activeZhFlipbook = flipbookZhId
    ? flipbookMap.get(flipbookZhId) ?? null
    : null;

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

  const sanitizedContents = {
    vi: sanitizeRichText(contentVi),
    en: sanitizeRichText(contentEn),
    zh: sanitizeRichText(contentZh),
  };

  const hasTextContent = Boolean(
    stripHtmlToText(contentVi) ||
      stripHtmlToText(contentEn) ||
      stripHtmlToText(contentZh)
  );

  const hasLinkedFlipbook = Boolean(
    info.fileType === 'flipbook' ||
      info.flipbookId ||
      flipbookEnId ||
      flipbookZhId
  );
  const hasActiveFlipbook = Boolean(
    activeViFlipbook || activeEnFlipbook || activeZhFlipbook
  );
  const hasAnyFile = Boolean(
    info.fileUrl || parsed.en?.fileUrl || parsed.zh?.fileUrl
  );

  if (hasLinkedFlipbook && !hasActiveFlipbook && !hasTextContent && !hasAnyFile) {
    notFound();
  }

  const detailData = {
    id: info.id,
    category: info.category,
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
    sanitizedContents,
    hasTextContent,
    hasTableByLang: {
      vi: hasHtmlTable(contentVi),
      en: hasHtmlTable(contentEn),
      zh: hasHtmlTable(contentZh),
    },
    fileType: hasActiveFlipbook
      ? info.fileType
      : info.fileType === 'flipbook'
      ? null
      : info.fileType,
    fileUrlByLang: {
      vi: info.fileUrl || null,
      en: parsed.en?.fileUrl || null,
      zh: parsed.zh?.fileUrl || null,
    },
    flipbooksByLang: {
      vi: activeViFlipbook,
      en: activeEnFlipbook,
      zh: activeZhFlipbook,
    },
  };

  return (
    <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
      <InformationDetailView info={detailData} token={params.token} />
    </div>
  );
}
