'use client';

import { FiGlobe, FiCheck } from 'react-icons/fi';
import {
  languages,
  languageAdminLabels,
  languageShortLabels,
  type Language,
} from '@/lib/i18n';

interface AdminLanguageTabsProps {
  activeLang: Language;
  onChange: (lang: Language) => void;
  filled?: Partial<Record<Language, boolean>>;
  compact?: boolean;
  hint?: string;
}

export default function AdminLanguageTabs({
  activeLang,
  onChange,
  filled,
  compact = false,
  hint,
}: AdminLanguageTabsProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
        {languages.map((lang) => {
          const isActive = activeLang === lang;
          const isFilled = lang === 'vi' ? true : Boolean(filled?.[lang]);
          return (
            <button
              key={lang}
              type="button"
              onClick={() => onChange(lang)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#866526] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{languageShortLabels[lang]}</span>
              {lang !== 'vi' && isFilled && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E6D3A7] bg-[#FAF7EE]/60 p-3.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#866526]">
          <FiGlobe className="w-4 h-4" />
          <span>Ngôn ngữ nội dung (VN / EN / ZH)</span>
        </div>

        <div className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6D3A7]">
          {languages.map((lang) => {
            const isActive = activeLang === lang;
            const isFilled = lang === 'vi' ? true : Boolean(filled?.[lang]);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onChange(lang)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white shadow-sm'
                    : 'text-stone-600 hover:text-[#866526] hover:bg-[#FAF7EE]'
                }`}
              >
                <span>{languageAdminLabels[lang]}</span>
                {lang === 'vi' ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    Mặc định
                  </span>
                ) : isFilled ? (
                  <FiCheck
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-emerald-200' : 'text-emerald-600'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-stone-600">
        {hint ??
          (activeLang === 'vi'
            ? 'Nhập nội dung Tiếng Việt mặc định. Sau đó chuyển sang tab English (EN) hoặc 中文 (ZH) để thêm bản dịch.'
            : activeLang === 'en'
            ? 'Đang nhập bản dịch Tiếng Anh (EN). Nếu để trống trường nào, khách sẽ thấy bản Tiếng Việt mặc định.'
            : 'Đang nhập bản dịch Tiếng Trung (ZH). Nếu để trống trường nào, hệ thống tự động hiển thị bản Tiếng Anh (hoặc Tiếng Việt).')}
      </p>
    </div>
  );
}
