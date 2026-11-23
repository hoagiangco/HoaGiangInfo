'use client';

import { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';
import {
  languages,
  languageNames,
  languageShortLabels,
  getTranslation,
} from '@/lib/i18n';
import { useLanguage } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3.5 bg-[#FBF6E8] hover:bg-[#F3E8CE] active:scale-[0.97] text-slate-900 border border-[#C9B483] rounded-full text-xs font-bold tracking-wide transition-all shadow-sm whitespace-nowrap shrink-0"
        aria-label={getTranslation(language, 'select_language')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <FiGlobe className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
        <span className="sm:hidden">{languageShortLabels[language]}</span>
        <span className="hidden sm:inline">{languageNames[language]}</span>
        <FiChevronDown
          className={`w-3.5 h-3.5 text-[#6E4E12] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={getTranslation(language, 'language_label')}
          className="absolute right-0 mt-2 bg-white border border-[#C9B483] rounded-2xl shadow-2xl z-50 min-w-[200px] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3.5 py-2 border-b border-slate-100">
            <span className="text-[11px] uppercase tracking-wider text-[#6E4E12] font-bold">
              {getTranslation(language, 'language_label')}
            </span>
          </div>
          {languages.map((lang) => {
            const isSelected = language === lang;
            return (
              <button
                key={lang}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-3 text-sm transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#FBF6E8] text-slate-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 rounded-md text-[11px] font-bold ${
                      isSelected
                        ? 'bg-[#0F172A] text-[#E8CA7A]'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {languageShortLabels[lang]}
                  </span>
                  <span className="whitespace-nowrap">{languageNames[lang]}</span>
                </span>
                {isSelected && (
                  <FiCheck className="w-4 h-4 text-[#6E4E12] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
