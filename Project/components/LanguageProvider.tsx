'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  Language,
  normalizeLanguage,
} from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

function readCookieLanguage(): Language | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split('=').slice(1).join('='));
  return value ? normalizeLanguage(value) : null;
}

function writeCookieLanguage(lang: Language) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(lang)}; path=/; max-age=31536000; SameSite=Lax`;
}

function isVietnameseOnlyRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/login' ||
    pathname === '/qr-codes'
  );
}

export default function LanguageProvider({
  initialLanguage = DEFAULT_LANGUAGE,
  children,
}: {
  initialLanguage?: Language;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>(() =>
    normalizeLanguage(initialLanguage)
  );

  useEffect(() => {
    const cookieLang = readCookieLanguage();
    const savedRaw = localStorage.getItem('language');
    const savedLang = savedRaw ? normalizeLanguage(savedRaw) : null;

    let resolved: Language;
    if (cookieLang) {
      resolved = cookieLang;
    } else if (savedLang) {
      resolved = savedLang;
      writeCookieLanguage(resolved);
    } else {
      // Standardize Vietnam default ('vi') instead of auto-switching to English
      // on Vietnamese devices with English OS/browser locales.
      resolved = DEFAULT_LANGUAGE;
      writeCookieLanguage(resolved);
    }

    setLanguageState(resolved);
    localStorage.setItem('language', resolved);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = isVietnameseOnlyRoute(pathname)
      ? DEFAULT_LANGUAGE
      : language;
  }, [language, pathname]);

  const setLanguage = useCallback((lang: Language) => {
    const normalized = normalizeLanguage(lang);
    setLanguageState(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', normalized);
      writeCookieLanguage(normalized);
      document.documentElement.lang = isVietnameseOnlyRoute(window.location.pathname)
        ? DEFAULT_LANGUAGE
        : normalized;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
