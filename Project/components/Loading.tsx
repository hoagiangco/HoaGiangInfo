'use client';

import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

export default function Loading() {
  const { language } = useLanguage();

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-[#D5C9B2] border-t-[#0F172A]" />
        <p className="text-slate-700 text-sm font-semibold">
          {getTranslation(language, 'loading')}
        </p>
      </div>
    </div>
  );
}
