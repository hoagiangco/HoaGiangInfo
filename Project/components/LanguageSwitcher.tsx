'use client';

import { useState } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { Language, languages, languageNames } from '@/lib/i18n';
import { useLanguage } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#FAF7EE] hover:bg-[#F4EBD4] text-[#684B1B] border border-[#E6D3A7] rounded-full text-xs font-medium tracking-wide transition-all shadow-sm"
        aria-label="Chọn ngôn ngữ"
      >
        <FiGlobe className="w-3.5 h-3.5 text-[#9C752B]" />
        <span>{languageNames[language]}</span>
        <FiChevronDown className={`w-3.5 h-3.5 text-[#9C752B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 bg-white/95 backdrop-blur-md border border-[#E6D3A7] rounded-2xl shadow-xl z-30 min-w-[160px] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-[#FAF7EE] mb-1">
              <span className="text-[10px] uppercase tracking-wider text-[#A38035] font-bold">Ngôn ngữ / Language</span>
            </div>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                  language === lang
                    ? 'bg-[#FAF7EE] text-[#866526] font-semibold'
                    : 'text-stone-700 hover:bg-[#FDFBF7] hover:text-[#9C752B]'
                }`}
              >
                <span>{languageNames[lang]}</span>
                {language === lang && <span className="w-1.5 h-1.5 rounded-full bg-[#9C752B]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
