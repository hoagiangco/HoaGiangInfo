'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { getTranslation } from '@/lib/i18n';

export default function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3EFE6] px-4">
      <div className="text-center max-w-md w-full bg-white rounded-2xl sm:rounded-3xl border border-[#CFC3AC] shadow-sm p-8 sm:p-10">
        <h1 className="font-serif text-6xl font-bold text-[#0F172A] mb-2">404</h1>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {getTranslation(language, 'not_found_title')}
        </h2>
        <p className="text-slate-700 text-sm mb-7 leading-relaxed">
          {getTranslation(language, 'not_found_desc')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-[#0F172A] text-[#E8CA7A] px-6 h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-sm"
        >
          {getTranslation(language, 'back_to_home')}
        </Link>
      </div>
    </div>
  );
}
