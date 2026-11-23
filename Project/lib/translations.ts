import type { Language } from './i18n';
import { normalizeLanguage } from './i18n';
import { parseMenuBilingual } from './bilingual-menu';

export type SecondaryLanguage = Exclude<Language, 'vi'>; // 'en' | 'zh'
export const SECONDARY_LANGUAGES: SecondaryLanguage[] = ['en', 'zh'];

export type TranslationFieldsBase = Record<string, string | null | undefined>;

export type TranslationMap<T extends TranslationFieldsBase> = Partial<
  Record<SecondaryLanguage, Partial<T>>
>;

export type ModuleTranslationFields = {
  displayName?: string | null;
  description?: string | null;
};

export type MenuTranslationFields = {
  name?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  flipbookId?: string | null;
};

export type MenuItemTranslationFields = {
  name?: string | null;
  description?: string | null;
  category?: string | null;
};

export type ServiceTranslationFields = {
  name?: string | null;
  description?: string | null;
  hours?: string | null;
  location?: string | null;
};

export type InformationTranslationFields = {
  title?: string | null;
  content?: string | null;
  fileUrl?: string | null;
  flipbookId?: string | null;
};

export type FloorPlanTranslationFields = {
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  fileType?: string | null;
};

export type RoomTranslationFields = {
  description?: string | null;
};

export type FlipbookTranslationFields = {
  name?: string | null;
  description?: string | null;
};

/**
 * Safely parse a Prisma JsonValue into a typed TranslationMap.
 */
export function parseTranslations<T extends Record<string, string | null | undefined>>(
  raw: unknown
): TranslationMap<T> {
  if (!raw) return {};
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return {};
  }

  const source = obj as Record<string, unknown>;
  const result: TranslationMap<T> = {};

  for (const lang of SECONDARY_LANGUAGES) {
    const entry = source[lang];
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const cleanedEntry: Record<string, string> = {};
      for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
        if (typeof v === 'string' && v.trim() !== '') {
          cleanedEntry[k] = v;
        }
      }
      if (Object.keys(cleanedEntry).length > 0) {
        result[lang] = cleanedEntry as Partial<T>;
      }
    }
  }

  return result;
}

/**
 * Strip empty strings / empty language buckets before saving to the DB.
 * Returns null if no secondary translations are provided.
 */
export function cleanTranslations<T extends Record<string, string | null | undefined>>(
  input: unknown,
  allowedFields?: (keyof T)[]
): TranslationMap<T> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const source = input as Record<string, unknown>;
  const result: TranslationMap<T> = {};

  for (const lang of SECONDARY_LANGUAGES) {
    const entry = source[lang];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

    const cleanedEntry: Record<string, string> = {};
    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
      if (allowedFields && !allowedFields.includes(k as keyof T)) continue;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        // Treat empty CKEditor markup like '<p></p>' or '<p>&nbsp;</p>' as empty
        const plainCheck = trimmed
          .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
          .trim();
        if (trimmed && plainCheck) {
          cleanedEntry[k] = trimmed;
        }
      }
    }

    if (Object.keys(cleanedEntry).length > 0) {
      result[lang] = cleanedEntry as Partial<T>;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Resolve a localized field value with graceful fallback:
 * - 'vi' -> defaultValue
 * - 'en' -> en -> defaultValue
 * - 'zh' -> zh -> en -> defaultValue
 */
export function getLocalizedValue<T extends Record<string, string | null | undefined>>(
  lang: Language,
  defaultValue: string | null | undefined,
  translations: unknown,
  field: keyof T
): string {
  const safeLang = normalizeLanguage(lang);
  const fallback = defaultValue ?? '';
  if (safeLang === 'vi') return fallback;

  const map = parseTranslations<T>(translations);
  const direct = map[safeLang]?.[field];
  if (typeof direct === 'string' && direct.trim() !== '') {
    return direct;
  }

  // For Chinese visitors, fall back to English before Vietnamese if available
  if (safeLang === 'zh') {
    const enVal = map.en?.[field];
    if (typeof enVal === 'string' && enVal.trim() !== '') {
      return enVal;
    }
  }

  return fallback;
}

/**
 * Pick the best available localized resource (e.g. Flipbook, PDF URL, Image URL, FloorPlan map)
 * based on the global active language with smart fallback:
 * - 'vi' -> vi -> en -> zh
 * - 'en' -> en -> vi -> zh
 * - 'zh' -> zh -> en -> vi
 */
export function pickLocalizedResource<T>(
  lang: Language,
  resources: Partial<Record<Language, T | null | undefined>>
): { lang: Language; value: T | null } {
  const safeLang = normalizeLanguage(lang);
  const priority: Language[] =
    safeLang === 'zh'
      ? ['zh', 'en', 'vi']
      : safeLang === 'en'
      ? ['en', 'vi', 'zh']
      : ['vi', 'en', 'zh'];

  for (const candidate of priority) {
    const val = resources[candidate];
    if (val !== null && val !== undefined && val !== '') {
      return { lang: candidate, value: val };
    }
  }

  return { lang: safeLang, value: null };
}

/**
 * Resolve a localized field STRICTLY for a given language (no cross-language fallback).
 * Useful for checking whether a specific language has its own file/PDF/flipbook or admin badge.
 */
export function getExactTranslation<T extends Record<string, string | null | undefined>>(
  lang: SecondaryLanguage,
  translations: unknown,
  field: keyof T
): string {
  const map = parseTranslations<T>(translations);
  const value = map[lang]?.[field];
  return typeof value === 'string' ? value : '';
}

/**
 * Return the list of languages that have actual content for the given fields.
 * Always includes 'vi' as the primary language.
 */
export function getAvailableLanguages<T extends Record<string, string | null | undefined>>(
  translations: unknown,
  fields?: (keyof T)[]
): Language[] {
  const map = parseTranslations<T>(translations);
  const available: Language[] = ['vi'];

  for (const lang of SECONDARY_LANGUAGES) {
    const bucket = map[lang];
    if (!bucket) continue;
    const keys = fields ? (fields as string[]) : Object.keys(bucket);
    const hasContent = keys.some((k) => {
      const val = bucket[k as keyof T];
      return typeof val === 'string' && val.trim() !== '';
    });
    if (hasContent) {
      available.push(lang);
    }
  }

  return available;
}

/**
 * Backward-compatible helper for Menu records.
 * Merges legacy JSON stored inside `Menu.description` (from lib/bilingual-menu.ts)
 * with the new `Menu.translations` JSON column (`translations` takes priority).
 */
export interface ResolvedMenuData {
  descriptionVi: string;
  translations: TranslationMap<MenuTranslationFields>;
}

export function resolveMenuTranslations(
  rawDescription: string | null | undefined,
  rawTranslations: unknown
): ResolvedMenuData {
  const legacy = parseMenuBilingual(rawDescription);
  const parsed = parseTranslations<MenuTranslationFields>(rawTranslations);

  const enMerged: Partial<MenuTranslationFields> = {
    ...(legacy.nameEn ? { name: legacy.nameEn } : {}),
    ...(legacy.descriptionEn ? { description: legacy.descriptionEn } : {}),
    ...(legacy.fileUrlEn ? { fileUrl: legacy.fileUrlEn } : {}),
    ...(legacy.flipbookEnId ? { flipbookId: legacy.flipbookEnId } : {}),
    ...(parsed.en || {}),
  };

  const merged: TranslationMap<MenuTranslationFields> = {};
  if (Object.keys(enMerged).length > 0) {
    merged.en = enMerged;
  }
  if (parsed.zh && Object.keys(parsed.zh).length > 0) {
    merged.zh = parsed.zh;
  }

  return {
    descriptionVi: legacy.descriptionVi,
    translations: merged,
  };
}
