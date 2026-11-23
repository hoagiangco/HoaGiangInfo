import { cookies } from 'next/headers';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  Language,
  normalizeLanguage,
} from './i18n';

/**
 * Determine the visitor's preferred language on the server:
 * 1. Explicit user selection stored in the `hg_lang` cookie
 * 2. Default Vietnamese ('vi') — Vietnam location standard (never overridden
 *    by English OS/browser Accept-Language headers on first visit).
 */
export function getServerLanguage(): Language {
  try {
    const cookieLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
    if (cookieLang) {
      return normalizeLanguage(cookieLang);
    }
  } catch {
    // Fallback safely during static prerendering when cookies aren't available
  }

  return DEFAULT_LANGUAGE;
}
