'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PDFViewer from './PDFViewer';
import FlipbookViewer from './FlipbookViewer';
import {
  FiArrowLeft,
  FiGrid,
  FiBookOpen,
  FiFileText,
  FiImage,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Menu {
  id: string;
  name: string;
  nameEn?: string | null;
  description: string | null;
  descriptionEn?: string | null;
  fileUrl: string | null;
  fileUrlEn?: string | null;
  fileType: string | null;
  flipbookId: string | null;
  flipbook: {
    id: string;
    name: string;
    pages: string[];
  } | null;
  flipbookEn?: {
    id: string;
    name: string;
    pages: string[];
  } | null;
  items: MenuItem[];
}

interface MenuDetailViewProps {
  menu: Menu;
  token?: string;
}

export default function MenuDetailView({ menu, token }: MenuDetailViewProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Determine whether this menu has a separate English document/flipbook
  const hasEnglishFlipbook = Boolean(menu.flipbookEn && menu.flipbookEn.pages.length > 0);
  const hasEnglishFile = Boolean(menu.fileUrlEn);
  const hasBilingualDocument = hasEnglishFlipbook || hasEnglishFile;

  // Sync document language with global website language (non-Vietnamese defaults to 'en' when available)
  const [docLang, setDocLang] = useState<'vi' | 'en'>(
    language !== 'vi' && hasBilingualDocument ? 'en' : 'vi'
  );

  useEffect(() => {
    if (hasBilingualDocument) {
      setDocLang(language === 'vi' ? 'vi' : 'en');
    } else {
      setDocLang('vi');
    }
  }, [language, hasBilingualDocument]);

  // Active localized name, description, fileUrl, and flipbook
  const displayName =
    (docLang === 'en' || language !== 'vi') && menu.nameEn ? menu.nameEn : menu.name;
  const displayDescription =
    (docLang === 'en' || language !== 'vi') && menu.descriptionEn
      ? menu.descriptionEn
      : menu.description;

  const activeFlipbook =
    docLang === 'en' && hasEnglishFlipbook ? menu.flipbookEn! : menu.flipbook;
  const fileUrl =
    docLang === 'en' && hasEnglishFile ? menu.fileUrlEn! : menu.fileUrl || null;
  const fileType =
    menu.fileType ||
    (fileUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : fileUrl ? 'image' : null);
  const isPDF = fileType === 'pdf';
  const isFlipbook = Boolean(fileType === 'flipbook' && activeFlipbook);

  // Determine initial view mode synchronously so there is no layout shift
  const defaultMode: 'items' | 'image' | 'pdf' | 'flipbook' = isFlipbook
    ? 'flipbook'
    : fileUrl
    ? isPDF
      ? 'pdf'
      : 'image'
    : 'items';

  const [viewMode, setViewMode] = useState<'items' | 'image' | 'pdf' | 'flipbook'>(defaultMode);

  // Get all categories from items
  const categories = Array.from(
    new Set(menu.items.map((item) => item.category || 'Khác'))
  ).sort();

  // Filter items by category
  const filteredItems = menu.items.filter(
    (item) =>
      selectedCategory === 'all' || (item.category || 'Khác') === selectedCategory
  );

  // Group items by category for display
  const itemsByCategory: Record<string, MenuItem[]> = {};
  filteredItems.forEach((item) => {
    const category = item.category || 'Khác';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });

  // Get all item images
  const itemImages = menu.items
    .filter((item) => item.image)
    .map((item) => item.image!);

  // Count available view modes to decide whether to show mode switcher
  const availableModesCount =
    (menu.items.length > 0 ? 1 : 0) +
    (isFlipbook ? 1 : 0) +
    (fileUrl ? 1 : 0) +
    (itemImages.length > 0 && !fileUrl ? 1 : 0);

  // Check if description is distinct from menu name
  const hasDistinctDescription =
    Boolean(displayDescription) &&
    displayDescription!.trim().toLowerCase() !== displayName.trim().toLowerCase();

  const isVisualDocumentMode =
    viewMode === 'flipbook' || viewMode === 'pdf' || viewMode === 'image';

  return (
    <div className="flex flex-col flex-1 space-y-3 sm:space-y-4">
      {/* Compact Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#EBDDC3]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {token && (
            <Link
              href={`/${token}/menu`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-[#866526] transition-colors shrink-0"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Menu</span>
            </Link>
          )}
          <span className="text-stone-300 shrink-0">/</span>
          <h1 className="font-serif text-lg sm:text-xl md:text-2xl font-bold text-stone-900 tracking-tight truncate">
            {displayName}
          </h1>
          {hasDistinctDescription && (
            <span className="hidden lg:inline-block text-xs text-stone-500 italic truncate max-w-md pl-2 border-l border-[#EBDDC3]">
              {displayDescription}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Bilingual Switcher in Header */}
          {hasBilingualDocument && (
            <div className="inline-flex items-center bg-[#FAF7EE] p-0.5 rounded-xl border border-[#E6D3A7]">
              <button
                type="button"
                onClick={() => setDocLang('vi')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  docLang === 'vi'
                    ? 'bg-[#866526] text-white shadow-sm'
                    : 'text-stone-600 hover:text-[#866526]'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setDocLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  docLang === 'en'
                    ? 'bg-[#866526] text-white shadow-sm'
                    : 'text-stone-600 hover:text-[#866526]'
                }`}
              >
                English
              </button>
            </div>
          )}

          {/* View Mode Switcher - Only render if more than 1 view mode exists */}
          {availableModesCount > 1 && (
            <div className="flex items-center gap-1 bg-stone-100/90 p-1 rounded-xl border border-stone-200/70">
              {menu.items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('items')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'items'
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FiGrid className="w-3.5 h-3.5" />
                  <span>Danh sách</span>
                </button>
              )}

              {isFlipbook && (
                <button
                  type="button"
                  onClick={() => setViewMode('flipbook')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'flipbook'
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FiBookOpen className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, 'flipbook') || 'Flipbook'}</span>
                </button>
              )}

              {fileUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode(isPDF ? 'pdf' : 'image')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'pdf' || viewMode === 'image'
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  <span>{isPDF ? 'Bản PDF' : 'Ảnh Menu'}</span>
                </button>
              )}

              {itemImages.length > 0 && !fileUrl && (
                <button
                  type="button"
                  onClick={() => setViewMode('image')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'image'
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <FiImage className="w-3.5 h-3.5" />
                  <span>Thư viện ảnh ({itemImages.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show description on mobile/tablet only if distinct and in items mode */}
      {hasDistinctDescription && !isVisualDocumentMode && (
        <p className="lg:hidden text-stone-600 text-xs sm:text-sm max-w-3xl leading-relaxed italic">
          &ldquo;{displayDescription}&rdquo;
        </p>
      )}

      {/* Flipbook View - Content-Adaptive Smart Sizing */}
      {viewMode === 'flipbook' && isFlipbook && activeFlipbook && (
        <FlipbookViewer
          pages={activeFlipbook.pages}
          title={
            activeFlipbook.name.trim().toLowerCase() !== displayName.trim().toLowerCase()
              ? activeFlipbook.name
              : undefined
          }
          docLang={hasEnglishFlipbook ? docLang : undefined}
          onChangeDocLang={hasEnglishFlipbook ? setDocLang : undefined}
        />
      )}

      {/* PDF View - Content-Adaptive Smart Sizing */}
      {viewMode === 'pdf' && fileUrl && isPDF && (
        <PDFViewer
          fileUrl={fileUrl}
          fileName={`${displayName}.pdf`}
          title={displayName}
          docLang={hasEnglishFile ? docLang : undefined}
          onChangeDocLang={hasEnglishFile ? setDocLang : undefined}
        />
      )}

      {/* Single Image or Item Gallery View - Content-Adaptive Smart Sizing */}
      {viewMode === 'image' && (fileUrl || itemImages.length > 0) && (
        <FlipbookViewer
          pages={fileUrl ? [fileUrl] : itemImages}
          title={displayName}
          docLang={fileUrl && hasEnglishFile ? docLang : undefined}
          onChangeDocLang={fileUrl && hasEnglishFile ? setDocLang : undefined}
        />
      )}

      {/* Items List View - Responsive Multi-Breakpoint Grid */}
      {viewMode === 'items' && (
        <div className="space-y-6 pt-1">
          {/* Category Filter Pills - Horizontal scroll on mobile, wrap on desktop */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white shadow-md shadow-[#866526]/20'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EBDDC3] hover:border-[#B58E38]'
                }`}
              >
                Tất cả ({menu.items.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white shadow-md shadow-[#866526]/20'
                      : 'bg-white text-stone-600 hover:text-stone-900 border border-[#EBDDC3] hover:border-[#B58E38]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grouped Items Display */}
          {Object.keys(itemsByCategory).length === 0 ? (
            <div className="bg-white rounded-2xl shadow-luxury p-10 text-center border border-[#EBDDC3] max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center mx-auto text-xl">
                <FiGrid className="w-5 h-5" />
              </div>
              <p className="font-serif text-base font-bold text-stone-800">
                Chưa có món ăn nào trong danh mục này
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="space-y-3.5">
                  {/* Category Header */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rotate-45 bg-[#B58E38]" />
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
                      {category}
                    </h2>
                    <span className="text-xs text-stone-400 font-medium">
                      ({items.length} món)
                    </span>
                    <div className="flex-1 h-[1px] bg-[#EBDDC3] ml-2" />
                  </div>

                  {/* Responsive Grid: 1 col mobile, 2 cols tablet, 3 cols wide desktop */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EBDDC3] shadow-card hover:border-[#B58E38] hover:shadow-luxury transition-all duration-300 flex items-start gap-3.5 h-full"
                      >
                        {item.image && (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 border border-stone-100 bg-stone-50">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 leading-snug">
                                {item.name}
                              </h3>
                              {item.price !== null && (
                                <span className="font-mono text-xs sm:text-sm font-bold text-[#866526] shrink-0 bg-[#FAF7EE] border border-[#E6D3A7]/70 px-2 py-0.5 rounded-lg">
                                  {item.price.toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-stone-600 text-xs mt-1 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="pt-2.5 mt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Sẵn sàng phục vụ
                            </span>
                            <span className="italic">4-Star Culinary</span>
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
