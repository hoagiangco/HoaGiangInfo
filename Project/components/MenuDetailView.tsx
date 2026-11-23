'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PDFViewer from './PDFViewer';
import FlipbookViewer from './FlipbookViewer';
import {
  FiArrowLeft,
  FiGrid,
  FiBookOpen,
  FiFileText,
  FiImage,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation, type Language } from '@/lib/i18n';
import { getLocaleForLanguage } from '@/lib/locale';
import {
  getLocalizedValue,
  pickLocalizedResource,
  type MenuItemTranslationFields,
  type MenuTranslationFields,
  type TranslationMap,
} from '@/lib/translations';

interface FlipbookData {
  id: string;
  name: string;
  pages: string[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
  price: number | null;
  image: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Menu {
  id: string;
  name: string;
  description: string | null;
  translations: TranslationMap<MenuTranslationFields>;
  fileUrl: string | null;
  fileType: string | null;
  flipbookId: string | null;
  flipbook: FlipbookData | null;
  flipbooksByLang?: Partial<Record<'en' | 'zh', FlipbookData | null>>;
  items: MenuItem[];
}

interface MenuDetailViewProps {
  menu: Menu;
  token?: string;
}

function normalizeQuery(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export default function MenuDetailView({ menu, token }: MenuDetailViewProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const flipbookForLang = useMemo(
    (): Record<Language, FlipbookData | null> => ({
      vi: menu.flipbook && menu.flipbook.pages.length > 0 ? menu.flipbook : null,
      en:
        menu.flipbooksByLang?.en && menu.flipbooksByLang.en.pages.length > 0
          ? menu.flipbooksByLang.en
          : null,
      zh:
        menu.flipbooksByLang?.zh && menu.flipbooksByLang.zh.pages.length > 0
          ? menu.flipbooksByLang.zh
          : null,
    }),
    [menu.flipbook, menu.flipbooksByLang]
  );

  const fileUrlForLang = useMemo(
    (): Record<Language, string | null> => ({
      vi: menu.fileUrl || null,
      en: menu.translations.en?.fileUrl || null,
      zh: menu.translations.zh?.fileUrl || null,
    }),
    [menu.fileUrl, menu.translations]
  );

  useEffect(() => {
    setSelectedCategory('all');
    setSearchQuery('');
  }, [language]);

  const displayName = getLocalizedValue<MenuTranslationFields>(
    language,
    menu.name,
    menu.translations,
    'name'
  );
  const displayDescription = getLocalizedValue<MenuTranslationFields>(
    language,
    menu.description,
    menu.translations,
    'description'
  );

  const resolvedFlipbook = useMemo(
    () => pickLocalizedResource(language, flipbookForLang),
    [language, flipbookForLang]
  );
  const resolvedFileUrl = useMemo(
    () => pickLocalizedResource(language, fileUrlForLang),
    [language, fileUrlForLang]
  );

  const activeFlipbook = resolvedFlipbook.value;
  const fileUrl = resolvedFileUrl.value;

  const fileType =
    menu.fileType ||
    (fileUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : fileUrl ? 'image' : null);
  const isPDF = fileType === 'pdf';
  const isFlipbook = Boolean(
    (fileType === 'flipbook' || (!fileUrl && activeFlipbook)) && activeFlipbook
  );

  const defaultMode: 'items' | 'image' | 'pdf' | 'flipbook' = isFlipbook
    ? 'flipbook'
    : fileUrl
    ? isPDF
      ? 'pdf'
      : 'image'
    : 'items';

  const [viewMode, setViewMode] = useState<'items' | 'image' | 'pdf' | 'flipbook'>(
    defaultMode
  );

  const otherCategoryLabel = getTranslation(language, 'menu_category_other');

  const localizedItems = useMemo(() => {
    return menu.items.map((item) => ({
      ...item,
      localizedName: getLocalizedValue<MenuItemTranslationFields>(
        language,
        item.name,
        item.translations,
        'name'
      ),
      localizedDescription: getLocalizedValue<MenuItemTranslationFields>(
        language,
        item.description,
        item.translations,
        'description'
      ),
      localizedCategory:
        getLocalizedValue<MenuItemTranslationFields>(
          language,
          item.category,
          item.translations,
          'category'
        ) || otherCategoryLabel,
    }));
  }, [menu.items, language, otherCategoryLabel]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(localizedItems.map((item) => item.localizedCategory))
      ).sort(),
    [localizedItems]
  );

  const normalizedSearch = normalizeQuery(searchQuery);

  const filteredItems = useMemo(() => {
    return localizedItems.filter((item) => {
      const catOk =
        selectedCategory === 'all' ||
        item.localizedCategory === selectedCategory;
      if (!catOk) return false;
      if (!normalizedSearch) return true;
      const haystack = normalizeQuery(
        `${item.localizedName} ${item.localizedDescription || ''} ${item.localizedCategory}`
      );
      return haystack.includes(normalizedSearch);
    });
  }, [localizedItems, selectedCategory, normalizedSearch]);

  const itemsByCategory: Record<string, typeof localizedItems> = {};
  filteredItems.forEach((item) => {
    const category = item.localizedCategory;
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });

  const itemImages = menu.items
    .filter((item) => item.image)
    .map((item) => item.image!);

  const availableModesCount =
    (menu.items.length > 0 ? 1 : 0) +
    (isFlipbook ? 1 : 0) +
    (fileUrl ? 1 : 0) +
    (itemImages.length > 0 && !fileUrl ? 1 : 0);

  const hasDistinctDescription =
    Boolean(displayDescription) &&
    displayDescription.trim().toLowerCase() !== displayName.trim().toLowerCase();

  const isVisualDocumentMode =
    viewMode === 'flipbook' || viewMode === 'pdf' || viewMode === 'image';

  const currencyLabel = getTranslation(language, 'menu_currency');
  const numberLocale = getLocaleForLanguage(language);

  return (
    <div className="flex flex-col flex-1 space-y-3 sm:space-y-4">
      {/* Compact High-Contrast Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#D5C9B2]">
        <div className="flex items-center gap-2.5 min-w-0">
          {token && (
            <Link
              href={`/${token}/menu`}
              aria-label={getTranslation(language, 'menu_back')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-white border border-[#CFC3AC] text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] shadow-sm transition-colors shrink-0 active:scale-95"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {getTranslation(language, 'menu_back')}
              </span>
            </Link>
          )}
          <h1 className="font-serif text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {displayName}
          </h1>
          {hasDistinctDescription && (
            <span className="hidden lg:inline-block text-xs text-slate-600 italic truncate max-w-md pl-2.5 border-l border-[#D5C9B2]">
              {displayDescription}
            </span>
          )}
        </div>

        {/* High-Contrast View Mode Switcher */}
        {availableModesCount > 1 && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CFC3AC] shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {menu.items.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode('items')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  viewMode === 'items'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FiGrid className="w-3.5 h-3.5" />
                <span>{getTranslation(language, 'menu_view_list')}</span>
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
                <FiFileText className="w-3.5 h-3.5" />
                <span>
                  {isPDF
                    ? getTranslation(language, 'menu_view_pdf')
                    : getTranslation(language, 'menu_view_image')}
                </span>
              </button>
            )}

            {itemImages.length > 0 && !fileUrl && (
              <button
                type="button"
                onClick={() => setViewMode('image')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  viewMode === 'image'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FiImage className="w-3.5 h-3.5" />
                <span>
                  {getTranslation(language, 'menu_view_gallery', {
                    count: itemImages.length,
                  })}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {hasDistinctDescription && !isVisualDocumentMode && (
        <p className="lg:hidden text-slate-700 text-xs sm:text-sm max-w-3xl leading-relaxed">
          {displayDescription}
        </p>
      )}

      {/* Flipbook View */}
      {viewMode === 'flipbook' && isFlipbook && activeFlipbook && (
        <FlipbookViewer pages={activeFlipbook.pages} title={displayName} />
      )}

      {/* PDF View */}
      {viewMode === 'pdf' && fileUrl && isPDF && (
        <PDFViewer
          fileUrl={fileUrl}
          fileName={`${displayName}.pdf`}
          title={displayName}
        />
      )}

      {/* Single Image or Item Gallery View */}
      {viewMode === 'image' && (fileUrl || itemImages.length > 0) && (
        <FlipbookViewer
          pages={fileUrl ? [fileUrl] : itemImages}
          title={displayName}
        />
      )}

      {/* Items List View — Fast Search + High-Contrast Category Pills + Crisp Dish Cards */}
      {viewMode === 'items' && (
        <div className="space-y-4">
          {/* Quick Dish Search when menu has 6+ items */}
          {localizedItems.length >= 6 && (
            <div className="relative">
              <FiSearch className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(language, 'menu_search_placeholder')}
                className="w-full h-11 pl-10 pr-10 bg-white border border-[#CFC3AC] rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] shadow-sm transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={getTranslation(language, 'info_clear_search')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Horizontal Scrollable Category Chips */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                    : 'bg-white text-slate-800 border border-[#CFC3AC] hover:border-[#0F172A]'
                }`}
              >
                {getTranslation(language, 'menu_all_items', {
                  count: localizedItems.length,
                })}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                      : 'bg-white text-slate-800 border border-[#CFC3AC] hover:border-[#0F172A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {Object.keys(itemsByCategory).length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-[#CFC3AC] max-w-md mx-auto space-y-2">
              <div className="w-11 h-11 rounded-full bg-[#FBF6E8] border border-[#C9B483] text-[#6E4E12] flex items-center justify-center mx-auto">
                <FiGrid className="w-5 h-5" />
              </div>
              <p className="font-serif text-base font-bold text-slate-900">
                {normalizedSearch
                  ? getTranslation(language, 'menu_search_empty', {
                      query: searchQuery,
                    })
                  : getTranslation(language, 'menu_empty_category')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rotate-45 bg-[#6E4E12]" />
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                      {category}
                    </h2>
                    <span className="text-xs font-bold text-slate-600">
                      ({items.length})
                    </span>
                    <div className="flex-1 h-[1px] bg-[#D5C9B2] ml-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4 items-stretch">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-3 sm:p-4 border border-[#CFC3AC] shadow-[0_1px_6px_rgba(15,23,42,0.05)] hover:border-[#0F172A] transition-all flex items-start gap-3 h-full"
                      >
                        {item.image && (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-[#D5C9B2] bg-slate-100">
                            <img
                              src={item.image}
                              alt={item.localizedName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-serif text-[15px] sm:text-base font-bold text-slate-900 leading-snug">
                                {item.localizedName}
                              </h3>
                              {item.price !== null && (
                                <span className="font-mono text-xs sm:text-sm font-extrabold text-[#6E4E12] shrink-0 bg-[#FBF6E8] border border-[#C9B483] px-2 py-0.5 rounded-lg whitespace-nowrap">
                                  {item.price.toLocaleString(numberLocale)}{' '}
                                  {currencyLabel}
                                </span>
                              )}
                            </div>
                            {item.localizedDescription && (
                              <p className="text-slate-700 text-xs sm:text-[13px] mt-1.5 leading-relaxed line-clamp-3">
                                {item.localizedDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
