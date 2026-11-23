'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiBookOpen,
  FiFileText,
  FiImage,
  FiAlignLeft,
  FiSearch,
  FiX,
  FiMove,
} from 'react-icons/fi';
import PDFViewer from './PDFViewer';
import FlipbookViewer from './FlipbookViewer';
import { useLanguage } from './LanguageProvider';
import {
  getTranslation,
  translateCategory,
  type Language,
} from '@/lib/i18n';
import { pickLocalizedResource } from '@/lib/translations';

interface FlipbookData {
  id: string;
  name: string;
  pages: string[];
}

interface InformationDetailData {
  id: string;
  category: string;
  titles: Record<Language, string>;
  sanitizedContents: Record<Language, string>;
  hasTextContent: boolean;
  hasTableByLang: Record<Language, boolean>;
  fileType: string | null;
  fileUrlByLang: Record<Language, string | null>;
  flipbooksByLang: Record<Language, FlipbookData | null>;
}

interface InformationDetailViewProps {
  info: InformationDetailData;
  token: string;
}

/** Remove Vietnamese diacritics & lowercase for fast accent-insensitive table search */
function normalizeSearchText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export default function InformationDetailView({
  info,
  token,
}: InformationDetailViewProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const flipbookForLang = useMemo(
    (): Record<Language, FlipbookData | null> => ({
      vi:
        info.flipbooksByLang.vi && info.flipbooksByLang.vi.pages.length > 0
          ? info.flipbooksByLang.vi
          : null,
      en:
        info.flipbooksByLang.en && info.flipbooksByLang.en.pages.length > 0
          ? info.flipbooksByLang.en
          : null,
      zh:
        info.flipbooksByLang.zh && info.flipbooksByLang.zh.pages.length > 0
          ? info.flipbooksByLang.zh
          : null,
    }),
    [info.flipbooksByLang]
  );

  useEffect(() => {
    setSearchQuery('');
  }, [language]);

  const activeFlipbook = useMemo(
    () => pickLocalizedResource(language, flipbookForLang).value,
    [language, flipbookForLang]
  );
  const fileUrl = useMemo(
    () => pickLocalizedResource(language, info.fileUrlByLang).value,
    [language, info.fileUrlByLang]
  );

  const fileType =
    info.fileType ||
    (fileUrl?.toLowerCase().endsWith('.pdf')
      ? 'pdf'
      : fileUrl
      ? 'image'
      : null);
  const isPDF = fileType === 'pdf';
  const isFlipbook = Boolean(
    (fileType === 'flipbook' || (!fileUrl && activeFlipbook)) && activeFlipbook
  );

  const defaultMode: 'content' | 'flipbook' | 'pdf' | 'image' = isFlipbook
    ? 'flipbook'
    : fileUrl
    ? isPDF
      ? 'pdf'
      : 'image'
    : 'content';

  const [viewMode, setViewMode] = useState<
    'content' | 'flipbook' | 'pdf' | 'image'
  >(defaultMode);

  const displayTitle = info.titles[language] || info.titles.vi;
  const activeContentHtml =
    info.sanitizedContents[language] || info.sanitizedContents.vi;
  const hasTable = info.hasTableByLang[language] || info.hasTableByLang.vi;
  const categoryLabel = info.category
    ? translateCategory(language, 'info_cat_', info.category)
    : getTranslation(language, 'info_cat_general');

  const availableModesCount =
    (info.hasTextContent ? 1 : 0) + (isFlipbook ? 1 : 0) + (fileUrl ? 1 : 0);

  // Live accent-insensitive table row filter & high-contrast cell highlight
  useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || !hasTable || viewMode !== 'content') {
      setMatchCount(null);
      return;
    }

    const q = normalizeSearchText(searchQuery);
    const tables = container.querySelectorAll('table');
    let matches = 0;

    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const isHeaderRow =
          row.parentElement?.tagName === 'THEAD' ||
          (cells.length > 0 && cells.every((c) => c.tagName === 'TH')) ||
          (cells.length === 1 &&
            Number(cells[0].getAttribute('colspan') || 1) > 1);

        cells.forEach((cell) => {
          cell.classList.remove(
            'bg-[#FEF3C7]',
            'font-bold',
            'text-slate-900'
          );
        });

        if (!q || isHeaderRow) {
          row.style.display = '';
          return;
        }

        const rowText = normalizeSearchText(row.textContent || '');
        if (rowText.includes(q)) {
          row.style.display = '';
          matches++;
          cells.forEach((cell) => {
            if (normalizeSearchText(cell.textContent || '').includes(q)) {
              cell.classList.add(
                'bg-[#FEF3C7]',
                'font-bold',
                'text-slate-900'
              );
            }
          });
        } else {
          row.style.display = 'none';
        }
      });
    });

    setMatchCount(q ? matches : null);
  }, [searchQuery, activeContentHtml, hasTable, viewMode]);

  return (
    <div className="flex flex-col flex-1 space-y-3 sm:space-y-4">
      {/* Compact High-Contrast Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#D5C9B2]">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href={`/${token}/information`}
            aria-label={getTranslation(language, 'info_back')}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-white border border-[#CFC3AC] text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] shadow-sm transition-colors shrink-0 active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {getTranslation(language, 'info_back')}
            </span>
          </Link>
          <h1 className="font-serif text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {displayTitle}
          </h1>
          <span className="hidden md:inline-flex text-[11px] font-bold uppercase tracking-wider text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full shrink-0">
            {categoryLabel}
          </span>
        </div>

        {/* High-Contrast View Mode Switcher */}
        {availableModesCount > 1 && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CFC3AC] shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {info.hasTextContent && (
              <button
                type="button"
                onClick={() => setViewMode('content')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  viewMode === 'content'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FiAlignLeft className="w-3.5 h-3.5" />
                <span>{getTranslation(language, 'info_view_content')}</span>
              </button>
            )}

            {isFlipbook && (
              <button
                type="button"
                onClick={() => setViewMode('flipbook')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  viewMode === 'flipbook'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FiBookOpen className="w-3.5 h-3.5" />
                <span>{getTranslation(language, 'flipbook')}</span>
              </button>
            )}

            {fileUrl && (
              <button
                type="button"
                onClick={() => setViewMode(isPDF ? 'pdf' : 'image')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  viewMode === 'pdf' || viewMode === 'image'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isPDF ? (
                  <FiFileText className="w-3.5 h-3.5" />
                ) : (
                  <FiImage className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPDF
                    ? getTranslation(language, 'info_type_pdf')
                    : getTranslation(language, 'info_type_image')}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flipbook Viewer */}
      {viewMode === 'flipbook' && isFlipbook && activeFlipbook && (
        <FlipbookViewer pages={activeFlipbook.pages} title={displayTitle} />
      )}

      {/* PDF Viewer */}
      {viewMode === 'pdf' && fileUrl && isPDF && (
        <PDFViewer
          fileUrl={fileUrl}
          fileName={`${displayTitle}.pdf`}
          title={displayTitle}
        />
      )}

      {/* Single Image Viewer */}
      {viewMode === 'image' && fileUrl && !isPDF && (
        <FlipbookViewer pages={[fileUrl]} title={displayTitle} />
      )}

      {/* Full-Width High-Contrast Rich Text / Interactive Table View */}
      {viewMode === 'content' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#CFC3AC] shadow-sm p-4 sm:p-7 lg:p-9 space-y-4">
          {hasTable && (
            <div className="space-y-2.5 pb-3 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <FiSearch className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={getTranslation(
                      language,
                      'info_search_placeholder'
                    )}
                    className="w-full h-11 pl-10 pr-10 bg-[#F3EFE6]/70 border border-[#C9B483] rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      title={getTranslation(language, 'info_clear_search')}
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {matchCount !== null && (
                  <div className="inline-flex items-center justify-center text-xs font-bold text-[#E8CA7A] bg-[#0F172A] px-3.5 h-10 rounded-xl shrink-0">
                    {getTranslation(language, 'info_search_matches', {
                      count: matchCount,
                    })}
                  </div>
                )}
              </div>

              <p className="sm:hidden inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <FiMove className="w-3.5 h-3.5 text-[#6E4E12]" />
                <span>{getTranslation(language, 'table_scroll_hint')}</span>
              </p>
            </div>
          )}

          {matchCount === 0 && searchQuery.trim() !== '' && (
            <div className="bg-[#FBF6E8] border border-[#C9B483] rounded-xl p-4 text-center text-sm font-semibold text-slate-800">
              {getTranslation(language, 'info_search_no_results', {
                query: searchQuery,
              })}
            </div>
          )}

          <div
            ref={contentContainerRef}
            className="prose max-w-none text-slate-800 leading-relaxed text-[15px] sm:text-base overflow-x-auto info-rich-content -mx-1 px-1"
            dangerouslySetInnerHTML={{ __html: activeContentHtml }}
          />
        </div>
      )}
    </div>
  );
}
