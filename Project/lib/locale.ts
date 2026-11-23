import { normalizeLanguage, type Language } from './i18n';

export const VN_LOCALE = 'vi-VN';
export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VN_UTC_OFFSET = '+07:00';
export const VN_CURRENCY = 'VND';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const vnDateTimePartsFormatter = new Intl.DateTimeFormat(VN_LOCALE, {
  timeZone: VN_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const vnNumberFormatter = new Intl.NumberFormat(VN_LOCALE);

export function getLocaleForLanguage(lang?: Language | string | null): string {
  const normalized = normalizeLanguage(lang);
  if (normalized === 'en') return 'en-US';
  if (normalized === 'zh') return 'zh-CN';
  return VN_LOCALE;
}

function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getVNParts(date: Date) {
  const parts = vnDateTimePartsFormatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    day: map.day ?? '01',
    month: map.month ?? '01',
    year: map.year ?? '1970',
    hour: map.hour ?? '00',
    minute: map.minute ?? '00',
    second: map.second ?? '00',
  };
}

/**
 * Formats a timestamp consistently in Vietnam time (UTC+7 / Asia/Ho_Chi_Minh)
 * as `DD/MM/YYYY HH:mm` (or `DD/MM/YYYY HH:mm:ss` when `withSeconds` is true).
 * Uses `formatToParts` so SSR and client output match identically.
 */
export function formatDateTimeVN(
  value: Date | string | number | null | undefined,
  options?: { withSeconds?: boolean; fallback?: string }
): string {
  const fallback = options?.fallback ?? '—';
  const date = toValidDate(value);
  if (!date) return fallback;
  const p = getVNParts(date);
  const time = options?.withSeconds
    ? `${p.hour}:${p.minute}:${p.second}`
    : `${p.hour}:${p.minute}`;
  return `${p.day}/${p.month}/${p.year} ${time}`;
}

/**
 * Formats a date in Vietnam format `DD/MM/YYYY` (Asia/Ho_Chi_Minh).
 * Plain `YYYY-MM-DD` strings are formatted directly without timezone shift.
 */
export function formatDateVN(
  value: Date | string | number | null | undefined,
  fallback = '—'
): string {
  if (typeof value === 'string') {
    const m = DATE_ONLY_RE.exec(value.trim());
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const date = toValidDate(value);
  if (!date) return fallback;
  const p = getVNParts(date);
  return `${p.day}/${p.month}/${p.year}`;
}

/**
 * Returns `YYYY-MM-DD` in Vietnam timezone (Asia/Ho_Chi_Minh).
 * Use for filenames, analytics day buckets, and date-input defaults instead of UTC `toISOString().slice(0, 10)`.
 */
export function formatIsoDateVN(value: Date | string | number = new Date()): string {
  const date = toValidDate(value) ?? new Date();
  const p = getVNParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Returns the current calendar year in Vietnam timezone (Asia/Ho_Chi_Minh). */
export function getCurrentYearVN(date: Date = new Date()): number {
  return Number(getVNParts(date).year);
}

/**
 * Parses a `YYYY-MM-DD` filter boundary as Vietnam local time (UTC+7)
 * so day-range queries align with Vietnam calendar days even on UTC servers.
 */
export function parseVNDateBoundary(
  value: string | undefined,
  endOfDay = false
): Date | undefined {
  if (!value || !DATE_ONLY_RE.test(value)) return undefined;
  const iso = `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${VN_UTC_OFFSET}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Formats numbers using Vietnam thousand/decimal separators (`vi-VN`). */
export function formatNumberVN(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return vnNumberFormatter.format(value);
}

/** Formats numbers according to the active guest display language. */
export function formatNumberForLanguage(value: number, lang: Language): string {
  return new Intl.NumberFormat(getLocaleForLanguage(lang)).format(value);
}
