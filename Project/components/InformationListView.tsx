'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiInfo,
  FiPhoneCall,
  FiWifi,
  FiShield,
  FiHelpCircle,
  FiTv,
  FiHome,
  FiBookOpen,
  FiChevronRight,
  FiCopy,
  FiCheck,
  FiLayers,
  FiFileText,
  FiImage,
  FiGrid,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import {
  getTranslation,
  languageShortLabels,
  translateCategory,
  type Language,
} from '@/lib/i18n';

export interface InformationListItem {
  id: string;
  category: string;
  icon: string | null;
  isQuick: boolean;
  hasTable: boolean;
  tableRowCount: number;
  attachmentType: 'flipbook' | 'pdf' | 'image' | null;
  availableLangs: Language[];
  titles: Record<Language, string>;
  sanitizedContents: Record<Language, string>;
  plainTexts: Record<Language, string>;
  previews: Record<Language, string>;
}

interface InformationListViewProps {
  token: string;
  items: InformationListItem[];
}

export function getInfoCategoryIcon(title: string, category: string) {
  const cat = (category || '').toLowerCase();
  const text = `${title} ${category}`.toLowerCase();

  if (
    cat === 'wifi' ||
    text.includes('wifi') ||
    text.includes('wi-fi') ||
    text.includes('internet') ||
    text.includes('mạng')
  ) {
    return <FiWifi className="w-5 h-5" />;
  }
  if (
    cat === 'tv' ||
    text.includes('tv') ||
    text.includes('sctv') ||
    text.includes('kênh') ||
    text.includes('channel') ||
    text.includes('频道')
  ) {
    return <FiTv className="w-5 h-5" />;
  }
  if (
    cat === 'phone' ||
    text.includes('liên hệ') ||
    text.includes('hotline') ||
    text.includes('phone') ||
    text.includes('điện thoại') ||
    text.includes('电话')
  ) {
    return <FiPhoneCall className="w-5 h-5" />;
  }
  if (
    cat === 'room-info' ||
    text.includes('room') ||
    text.includes('phòng') ||
    text.includes('check-in') ||
    text.includes('客房')
  ) {
    return <FiHome className="w-5 h-5" />;
  }
  if (
    cat === 'safety' ||
    text.includes('an ninh') ||
    text.includes('an toàn') ||
    text.includes('safety') ||
    text.includes('quy định') ||
    text.includes('安全')
  ) {
    return <FiShield className="w-5 h-5" />;
  }
  if (
    cat === 'guide' ||
    text.includes('hướng dẫn') ||
    text.includes('guide') ||
    text.includes('指南')
  ) {
    return <FiBookOpen className="w-5 h-5" />;
  }
  if (text.includes('faq')) {
    return <FiHelpCircle className="w-5 h-5" />;
  }
  return <FiInfo className="w-5 h-5" />;
}

/**
 * Extract a copyable Wi-Fi password value from short text like "Password: hoagiangkg"
 */
function extractWifiPassword(text: string): string | null {
  const match = text.match(
    /(?:password|mật khẩu|pass|pw|密码)\s*[:：]\s*([^\s,;\n]+)/i
  );
  if (match?.[1]) return match[1].trim();
  return null;
}

/**
 * Remove duplicate standalone password line(s) from Wi-Fi card HTML
 * when the dedicated 1-tap Copy password bar is displayed below.
 */
function stripWifiPasswordLine(html: string): string {
  const passwordOnlyRe =
    /^\s*(?:password|mật khẩu|pass|pw|密码)\s*[:：]\s*[^\s,;\n]+\s*$/i;

  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // Remove <p>, <div>, <li> blocks that contain only the password line
  let cleaned = html.replace(
    /<(p|div|li)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (full, _tag, inner) => {
      if (passwordOnlyRe.test(stripTags(inner))) {
        return '';
      }
      // Handle single block with <br> lines
      const parts = inner.split(/<br\s*\/?>/gi);
      if (parts.length > 1) {
        const kept = parts.filter((part: string) => !passwordOnlyRe.test(stripTags(part)));
        if (kept.length === 0) return '';
        if (kept.length !== parts.length) {
          return `<${_tag}>${kept.join('<br />')}</${_tag}>`;
        }
      }
      return full;
    }
  );

  // If no visible text remains, return empty string so we skip rendering an empty wrapper
  return stripTags(cleaned) ? cleaned : '';
}

export default function InformationListView({
  token,
  items,
}: InformationListViewProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.category || 'general')));
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter(
      (item) => (item.category || 'general') === selectedCategory
    );
  }, [items, selectedCategory]);

  const quickItems = filteredItems.filter((item) => item.isQuick);
  const detailedItems = filteredItems.filter((item) => !item.isQuick);

  async function handleCopy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedId(id);
        setTimeout(() => {
          setCopiedId((prev) => (prev === id ? null : prev));
        }, 2000);
      } catch {
        // Clipboard unavailable
      }
    }
  }

  function renderTypeBadge(info: InformationListItem) {
    const cls =
      'inline-flex items-center gap-1 text-[10.5px] font-bold text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full whitespace-nowrap';
    if (info.attachmentType === 'flipbook') {
      return (
        <span className={cls}>
          <FiLayers className="w-3 h-3" />
          {getTranslation(language, 'flipbook')}
        </span>
      );
    }
    if (info.attachmentType === 'pdf') {
      return (
        <span className={cls}>
          <FiFileText className="w-3 h-3" />
          {getTranslation(language, 'info_type_pdf')}
        </span>
      );
    }
    if (info.attachmentType === 'image') {
      return (
        <span className={cls}>
          <FiImage className="w-3 h-3" />
          {getTranslation(language, 'info_type_image')}
        </span>
      );
    }
    if (info.hasTable) {
      return (
        <span className={cls}>
          <FiGrid className="w-3 h-3" />
          {getTranslation(language, 'info_type_table')}
        </span>
      );
    }
    return (
      <span className={cls}>
        <FiBookOpen className="w-3 h-3" />
        {getTranslation(language, 'info_type_guide')}
      </span>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Compact High-Contrast Page Header — Full untruncated intro text */}
      <div className="pb-3 border-b border-[#D5C9B2] space-y-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/${token}`}
            aria-label={getTranslation(language, 'back_home')}
            className="w-10 h-10 rounded-xl bg-white border border-[#CFC3AC] text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] flex items-center justify-center shrink-0 shadow-sm transition-colors active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {getTranslation(language, 'info_page_title')}
            </h1>
            {items.length > 0 && (
              <span className="text-[11px] font-bold text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {getTranslation(language, 'module_count_information', {
                  count: items.length,
                })}
              </span>
            )}
          </div>
        </div>
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
          {getTranslation(language, 'info_page_subtitle')}
        </p>
      </div>

      {/* Single-Row Scrollable Category Filter Pills */}
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
            {getTranslation(language, 'all')} ({items.length})
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
              {translateCategory(language, 'info_cat_', cat)}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#CFC3AC] max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FBF6E8] border border-[#C9B483] text-[#6E4E12] flex items-center justify-center mx-auto">
            <FiInfo className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            {getTranslation(language, 'info_empty_title')}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {getTranslation(language, 'info_empty_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: Quick Essentials (Instant 0-tap glance + 1-tap Wi-Fi Copy) */}
          {quickItems.length > 0 && (
            <section className="space-y-3">
              {detailedItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rotate-45 bg-[#6E4E12]" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    {getTranslation(language, 'info_quick_section')}
                  </h2>
                  <div className="flex-1 h-[1px] bg-[#D5C9B2] ml-1" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
                {quickItems.map((info) => {
                  const title = info.titles[language] || info.titles.vi;
                  const contentHtml =
                    info.sanitizedContents[language] ||
                    info.sanitizedContents.vi;
                  const plainText =
                    info.plainTexts[language] || info.plainTexts.vi;
                  const categoryLabel = info.category
                    ? translateCategory(language, 'info_cat_', info.category)
                    : getTranslation(language, 'info_cat_general');
                  const wifiPassword =
                    info.category === 'wifi'
                      ? extractWifiPassword(plainText)
                      : null;
                  const displayContentHtml = wifiPassword
                    ? stripWifiPasswordLine(contentHtml)
                    : contentHtml;

                  return (
                    <div
                      key={info.id}
                      className="bg-white rounded-2xl border border-[#CFC3AC] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0">
                              {getInfoCategoryIcon(title, info.category)}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#6E4E12] truncate">
                                {categoryLabel}
                              </span>
                              <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                                {title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {displayContentHtml && (
                          <div
                            className="prose prose-sm max-w-none text-slate-800 leading-relaxed text-[14px] [&>p]:my-1 info-rich-content"
                            dangerouslySetInnerHTML={{ __html: displayContentHtml }}
                          />
                        )}

                        {/* 1-tap High-Contrast Copy Wi-Fi Password (single deduplicated row) */}
                        {wifiPassword && (
                          <div
                            className={`${
                              displayContentHtml ? 'mt-3' : 'mt-1'
                            } flex items-center justify-between gap-2 bg-[#F3EFE6] border border-[#C9B483] rounded-xl p-2 pl-3.5`}
                          >
                            <div className="min-w-0 truncate text-sm">
                              <span className="text-slate-600 font-semibold mr-1.5">
                                {getTranslation(language, 'quick_wifi_password')}:
                              </span>
                              <code className="font-mono font-extrabold text-slate-900">
                                {wifiPassword}
                              </code>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(info.id, wifiPassword)}
                              className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 ${
                                copiedId === info.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A]'
                              }`}
                            >
                              {copiedId === info.id ? (
                                <>
                                  <FiCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {getTranslation(language, 'info_copied')}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FiCopy className="w-3.5 h-3.5" />
                                  <span>
                                    {getTranslation(language, 'info_copy')}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: Tables, Long Guides & Attached Documents */}
          {detailedItems.length > 0 && (
            <section className="space-y-3">
              {quickItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rotate-45 bg-[#6E4E12] shrink-0" />
                  <h2 className="font-serif text-base sm:text-xl font-bold text-slate-900 leading-snug">
                    {getTranslation(language, 'info_guides_section')}
                  </h2>
                  <div className="flex-1 h-[1px] bg-[#D5C9B2] ml-1" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                {detailedItems.map((info) => {
                  const title = info.titles[language] || info.titles.vi;
                  const categoryLabel = info.category
                    ? translateCategory(language, 'info_cat_', info.category)
                    : getTranslation(language, 'info_cat_general');
                  const preview =
                    info.previews[language] ||
                    info.previews.vi ||
                    (info.hasTable
                      ? getTranslation(language, 'info_table_preview', {
                          rows: Math.max(1, info.tableRowCount),
                        })
                      : getTranslation(language, 'info_doc_preview'));

                  return (
                    <Link
                      key={info.id}
                      href={`/${token}/information/${info.id}`}
                      className="group bg-white rounded-2xl border border-[#CFC3AC] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:border-[#0F172A] md:hover:-translate-y-0.5 hover:shadow-luxury transition-all duration-200 flex flex-col justify-between active:scale-[0.985]"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="w-11 h-11 rounded-xl bg-[#E0E7FF] border border-[#A5B4FC] text-[#1E1B4B] flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-[#E8CA7A] group-hover:border-[#0F172A] transition-colors shrink-0">
                            {getInfoCategoryIcon(title, info.category)}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            {info.availableLangs.length > 1 && (
                              <span className="inline-flex items-center text-[10.5px] font-bold uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                                {info.availableLangs
                                  .map((l) => languageShortLabels[l])
                                  .join(' / ')}
                              </span>
                            )}
                            {renderTypeBadge(info)}
                          </div>
                        </div>

                        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6E4E12] mb-0.5">
                          {categoryLabel}
                        </p>

                        <h3 className="font-serif text-base sm:text-xl font-bold text-slate-900 group-hover:text-[#6E4E12] transition-colors leading-snug">
                          {title}
                        </h3>

                        <p className="text-slate-700 text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1.5 mb-3 sm:mb-4">
                          {preview}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-[#6E4E12] group-hover:text-slate-900">
                        <span className="tracking-wider uppercase text-[11px]">
                          {getTranslation(language, 'info_view_detail')}
                        </span>
                        <span className="w-7 h-7 rounded-full bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                          <FiChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
