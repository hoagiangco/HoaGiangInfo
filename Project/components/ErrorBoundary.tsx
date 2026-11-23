'use client';

import { useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const { language } = useLanguage();

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(error?.message || '');

  function handleRetry() {
    if (isChunkError && typeof window !== 'undefined') {
      window.location.reload();
      return;
    }
    reset();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3EFE6] px-4">
      <div className="text-center max-w-md w-full bg-white rounded-2xl sm:rounded-3xl border border-[#CFC3AC] shadow-sm p-8 sm:p-10">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mb-2">
          {getTranslation(language, 'error_title')}
        </h2>
        <p className="text-slate-700 text-sm mb-6">{error.message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="bg-[#0F172A] text-[#E8CA7A] px-6 h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider hover:bg-slate-800 transition-all"
        >
          {getTranslation(language, 'try_again')}
        </button>
      </div>
    </div>
  );
}
