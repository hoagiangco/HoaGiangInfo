import { z } from 'zod';
import { normalizeLanguage, type Language } from './i18n';

export const FOOTER_SETTING_KEY = 'footer';

export const FOOTER_ICON_KEYS = [
  'phone',
  'clock',
  'shield',
  'mail',
  'map-pin',
  'wifi',
  'message',
  'info',
  'heart',
  'star',
] as const;

export type FooterIconKey = (typeof FOOTER_ICON_KEYS)[number];

export const FOOTER_ICON_LABELS: Record<FooterIconKey, string> = {
  phone: 'Điện thoại / Lễ tân',
  clock: 'Đồng hồ / Giờ phục vụ',
  shield: 'An ninh & Y tế',
  mail: 'Email / Liên hệ',
  'map-pin': 'Địa chỉ / Vị trí',
  wifi: 'Wi-Fi / Kết nối',
  message: 'Tin nhắn / Hỗ trợ',
  info: 'Thông tin',
  heart: 'Chăm sóc khách hàng',
  star: 'Đặc quyền / 4 sao',
};

export interface LocalizedText {
  vi: string;
  en?: string;
  zh?: string;
}

export interface ConciergeBadgeItem {
  id: string;
  icon: FooterIconKey;
  label: LocalizedText;
  highlight?: LocalizedText;
  suffix?: LocalizedText;
  href?: string;
  isActive: boolean;
}

export const LOGO_FRAME_STYLES = ['none', 'light', 'dark'] as const;
export type LogoFrameStyle = (typeof LOGO_FRAME_STYLES)[number];

export const POPUP_FREQUENCIES = ['session', 'always'] as const;
export type PopupFrequency = (typeof POPUP_FREQUENCIES)[number];

export interface BrandingConfig {
  logoUrl: string;
  logoFrame: LogoFrameStyle;
  brandTitle: string;
  brandSubtitle: LocalizedText;
}

export interface WelcomePopupConfig {
  enabled: boolean;
  frequency: PopupFrequency;
  imageUrl: string;
  badge: LocalizedText;
  title: LocalizedText;
  message: LocalizedText;
  ctaLabel: LocalizedText;
  showLanguagePicker: boolean;
  showWifiQuickCopy: boolean;
}

export interface FooterConfig {
  branding: BrandingConfig;
  welcomePopup: WelcomePopupConfig;
  concierge: {
    enabled: boolean;
    showOnAllPages: boolean;
    icon: FooterIconKey;
    title: LocalizedText;
    subtitle: LocalizedText;
    items: ConciergeBadgeItem[];
  };
  brandFooter: {
    enabled: boolean;
    resortName: LocalizedText;
    welcomeText: LocalizedText;
    copyrightText: LocalizedText;
    address: LocalizedText;
    hotline: string;
    email: string;
  };
}

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  branding: {
    logoUrl: '',
    logoFrame: 'none',
    brandTitle: 'HOA GIANG',
    brandSubtitle: {
      vi: 'Hòa Bình Rạch Giá Resort',
      en: 'Hoa Binh Rach Gia Resort',
      zh: '和平迪石度假村',
    },
  },
  welcomePopup: {
    enabled: true,
    frequency: 'session',
    imageUrl: '',
    badge: {
      vi: 'CHÀO MỪNG QUÝ KHÁCH',
      en: 'WARM WELCOME',
      zh: '诚挚欢迎莅临',
    },
    title: {
      vi: 'Hòa Bình Rạch Giá Resort',
      en: 'Hoa Binh Rach Gia Resort',
      zh: '和平迪石度假村',
    },
    message: {
      vi: 'Kính chúc Quý khách có những phút giây nghỉ dưỡng thật thư thái và trọn vẹn. Mọi tiện ích ẩm thực, dịch vụ 4 sao và thông tin lưu trú đều sẵn sàng ngay trên điện thoại của Quý khách.',
      en: 'We wish you a truly relaxing and memorable stay. Explore our 4-star dining, wellness amenities, Wi-Fi, and stay essentials right from your phone.',
      zh: '祝您在和平迪石度假村度过惬意舒适的美好时光。精选美食菜单、四星级设施服务与入住指南尽在您的指尖。',
    },
    ctaLabel: {
      vi: 'Khám Phá Ngay',
      en: 'Start Exploring',
      zh: '立即探索',
    },
    showLanguagePicker: true,
    showWifiQuickCopy: true,
  },
  concierge: {
    enabled: true,
    showOnAllPages: false,
    icon: 'phone',
    title: {
      vi: 'Cần Hỗ Trợ Trực Tiếp?',
      en: 'Need Personal Assistance?',
      zh: '需要即时协助？',
    },
    subtitle: {
      vi: 'Đội ngũ Quản gia & Lễ tân luôn sẵn sàng hỗ trợ Quý khách 24/7',
      en: 'Our Butler & Front Desk team is always ready to assist you 24/7',
      zh: '我们的管家与前台团队 24 小时全天候为您服务',
    },
    items: [
      {
        id: 'concierge-front-desk',
        icon: 'phone',
        label: {
          vi: 'Bấm phím',
          en: 'Dial',
          zh: '拨打分机',
        },
        highlight: {
          vi: '100',
          en: '100',
          zh: '100',
        },
        suffix: {
          vi: '(Lễ tân)',
          en: '(Front Desk)',
          zh: '（前台）',
        },
        href: '',
        isActive: true,
      },
      {
        id: 'concierge-room-service',
        icon: 'clock',
        label: {
          vi: 'Dịch vụ phòng:',
          en: 'Room Service:',
          zh: '客房服务：',
        },
        highlight: {
          vi: '24/24',
          en: '24/7',
          zh: '24小时',
        },
        suffix: {
          vi: '',
          en: '',
          zh: '',
        },
        href: '',
        isActive: true,
      },
      {
        id: 'concierge-security',
        icon: 'shield',
        label: {
          vi: 'An ninh & Y tế hỗ trợ ngay',
          en: '24/7 Security & Medical Support',
          zh: '全天候安保与医疗支持',
        },
        highlight: {
          vi: '',
          en: '',
          zh: '',
        },
        suffix: {
          vi: '',
          en: '',
          zh: '',
        },
        href: '',
        isActive: true,
      },
    ],
  },
  brandFooter: {
    enabled: true,
    resortName: {
      vi: 'Hòa Bình Rạch Giá Resort',
      en: 'Hoa Binh Rach Gia Resort',
      zh: '和平迪石度假村',
    },
    welcomeText: {
      vi: '★★★★ HÂN HẠNH ĐƯỢC ĐÓN TIẾP & PHỤC VỤ QUÝ KHÁCH',
      en: '★★★★ IT IS OUR PLEASURE TO WELCOME & SERVE YOU',
      zh: '★★★★ 诚挚欢迎您的光临，竭诚为您服务',
    },
    copyrightText: {
      vi: '© {year} Hòa Bình Rạch Giá Resort • Hòa Giang Hospitality. Bảo lưu mọi quyền.',
      en: '© {year} Hoa Binh Rach Gia Resort • Hoa Giang Hospitality. All rights reserved.',
      zh: '© {year} 和平迪石度假村 • Hoa Giang Hospitality. 保留所有权利。',
    },
    address: {
      vi: '',
      en: '',
      zh: '',
    },
    hotline: '',
    email: '',
  },
};

/**
 * Only allow safe URL schemes (tel:, mailto:, http:, https:, or internal /path).
 */
export function sanitizeSafeHref(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('https://') ||
    lower.startsWith('http://')
  ) {
    return trimmed;
  }

  return null;
}

const safeHrefSchema = z
  .string()
  .trim()
  .max(300)
  .refine(
    (val) => val === '' || sanitizeSafeHref(val) !== null,
    'Liên kết chỉ chấp nhận tel:, mailto:, http://, https:// hoặc đường dẫn bắt đầu bằng /'
  );

const localizedTextSchema = (maxLen = 300, requiredVi = false) =>
  z.object({
    vi: requiredVi
      ? z.string().trim().min(1, 'Vui lòng nhập nội dung Tiếng Việt').max(maxLen)
      : z.string().trim().max(maxLen).default(''),
    en: z.string().trim().max(maxLen).optional().default(''),
    zh: z.string().trim().max(maxLen).optional().default(''),
  });

const iconKeySchema = z.enum(FOOTER_ICON_KEYS);

export const conciergeBadgeItemSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    icon: iconKeySchema.default('phone'),
    label: localizedTextSchema(200, false),
    highlight: localizedTextSchema(100, false).optional().default({ vi: '', en: '', zh: '' }),
    suffix: localizedTextSchema(200, false).optional().default({ vi: '', en: '', zh: '' }),
    href: safeHrefSchema.optional().default(''),
    isActive: z.boolean().default(true),
  })
  .refine(
    (item) =>
      Boolean(
        item.label.vi.trim() ||
          item.highlight?.vi.trim() ||
          item.suffix?.vi.trim()
      ),
    {
      message: 'Mỗi mục hỗ trợ phải có ít nhất một nội dung Tiếng Việt',
      path: ['label', 'vi'],
    }
  );

const logoFrameSchema = z.enum(LOGO_FRAME_STYLES);
const popupFrequencySchema = z.enum(POPUP_FREQUENCIES);

const safeLogoUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (val) => {
      if (val === '') return true;
      const safe = sanitizeSafeHref(val);
      return (
        safe !== null &&
        (safe.startsWith('/') ||
          safe.toLowerCase().startsWith('https://') ||
          safe.toLowerCase().startsWith('http://'))
      );
    },
    'Đường dẫn hình ảnh không hợp lệ'
  );

export const footerConfigSchema = z.object({
  branding: z
    .object({
      logoUrl: safeLogoUrlSchema.default(''),
      logoFrame: logoFrameSchema.default('none'),
      brandTitle: z.string().trim().max(80).default('HOA GIANG'),
      brandSubtitle: localizedTextSchema(120, false).default({
        vi: 'Hòa Bình Rạch Giá Resort',
        en: 'Hoa Binh Rach Gia Resort',
        zh: '和平迪石度假村',
      }),
    })
    .optional()
    .default(DEFAULT_FOOTER_CONFIG.branding),
  welcomePopup: z
    .object({
      enabled: z.boolean().default(true),
      frequency: popupFrequencySchema.default('session'),
      imageUrl: safeLogoUrlSchema.default(''),
      badge: localizedTextSchema(120, false).default(
        DEFAULT_FOOTER_CONFIG.welcomePopup.badge
      ),
      title: localizedTextSchema(160, false).default(
        DEFAULT_FOOTER_CONFIG.welcomePopup.title
      ),
      message: localizedTextSchema(600, false).default(
        DEFAULT_FOOTER_CONFIG.welcomePopup.message
      ),
      ctaLabel: localizedTextSchema(80, false).default(
        DEFAULT_FOOTER_CONFIG.welcomePopup.ctaLabel
      ),
      showLanguagePicker: z.boolean().default(true),
      showWifiQuickCopy: z.boolean().default(true),
    })
    .optional()
    .default(DEFAULT_FOOTER_CONFIG.welcomePopup),
  concierge: z.object({
    enabled: z.boolean().default(true),
    showOnAllPages: z.boolean().default(false),
    icon: iconKeySchema.default('phone'),
    title: localizedTextSchema(200, false),
    subtitle: localizedTextSchema(400, false),
    items: z.array(conciergeBadgeItemSchema).max(12),
  }),
  brandFooter: z.object({
    enabled: z.boolean().default(true),
    resortName: localizedTextSchema(200, false),
    welcomeText: localizedTextSchema(300, false),
    copyrightText: localizedTextSchema(300, false),
    address: localizedTextSchema(300, false).default({ vi: '', en: '', zh: '' }),
    hotline: z.string().trim().max(60).default(''),
    email: z
      .string()
      .trim()
      .max(120)
      .refine(
        (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        'Địa chỉ email không hợp lệ'
      )
      .default(''),
  }),
});

/**
 * Resolve a single localized field with standard fallback:
 * - 'vi' -> vi
 * - 'en' -> en -> vi
 * - 'zh' -> zh -> en -> vi
 */
export function resolveLocalizedText(
  lang: Language,
  text: LocalizedText | undefined | null,
  fallback = ''
): string {
  const safeLang = normalizeLanguage(lang);
  if (!text) return fallback;

  const vi = (text.vi ?? '').trim();
  const en = (text.en ?? '').trim();
  const zh = (text.zh ?? '').trim();

  if (safeLang === 'vi') return vi || fallback;
  if (safeLang === 'en') return en || vi || fallback;
  return zh || en || vi || fallback;
}

/**
 * Resolve all 3 parts of a concierge badge together per language bucket so that
 * partially translated items do not accidentally append Vietnamese suffixes onto
 * English/Chinese labels.
 */
export function resolveBadgeParts(
  lang: Language,
  item: ConciergeBadgeItem
): { label: string; highlight: string; suffix: string } {
  const safeLang = normalizeLanguage(lang);

  const pickBucket = (l: Language) => ({
    label: (item.label?.[l] ?? '').trim(),
    highlight: (item.highlight?.[l] ?? '').trim(),
    suffix: (item.suffix?.[l] ?? '').trim(),
  });

  const hasAny = (b: { label: string; highlight: string; suffix: string }) =>
    Boolean(b.label || b.highlight || b.suffix);

  if (safeLang === 'vi') {
    return pickBucket('vi');
  }

  if (safeLang === 'en') {
    const en = pickBucket('en');
    return hasAny(en) ? en : pickBucket('vi');
  }

  const zh = pickBucket('zh');
  if (hasAny(zh)) return zh;
  const en = pickBucket('en');
  if (hasAny(en)) return en;
  return pickBucket('vi');
}

export function formatPhoneHref(phone: string): string {
  const cleaned = phone.replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
}

function mergeLocalized(
  raw: unknown,
  def: LocalizedText
): LocalizedText {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...def };
  }
  const obj = raw as Record<string, unknown>;
  return {
    vi: typeof obj.vi === 'string' ? obj.vi : def.vi,
    en: typeof obj.en === 'string' ? obj.en : (def.en ?? ''),
    zh: typeof obj.zh === 'string' ? obj.zh : (def.zh ?? ''),
  };
}

function isIconKey(v: unknown): v is FooterIconKey {
  return typeof v === 'string' && (FOOTER_ICON_KEYS as readonly string[]).includes(v);
}

function isLogoFrameStyle(v: unknown): v is LogoFrameStyle {
  return typeof v === 'string' && (LOGO_FRAME_STYLES as readonly string[]).includes(v);
}

function isPopupFrequency(v: unknown): v is PopupFrequency {
  return typeof v === 'string' && (POPUP_FREQUENCIES as readonly string[]).includes(v);
}

function sanitizeImageUrl(raw: unknown): string {
  const str = typeof raw === 'string' ? raw.trim() : '';
  const safe = sanitizeSafeHref(str);
  return safe &&
    (safe.startsWith('/') ||
      safe.toLowerCase().startsWith('https://') ||
      safe.toLowerCase().startsWith('http://'))
    ? safe
    : '';
}

/**
 * Normalize raw JSON from DB into a guaranteed-valid FooterConfig, merging
 * missing fields from DEFAULT_FOOTER_CONFIG.
 */
export function normalizeFooterConfig(raw: unknown): FooterConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return structuredCloneSafe(DEFAULT_FOOTER_CONFIG);
  }

  const root = raw as Record<string, unknown>;
  const rawBranding =
    root.branding && typeof root.branding === 'object' && !Array.isArray(root.branding)
      ? (root.branding as Record<string, unknown>)
      : {};
  const rawWelcomePopup =
    root.welcomePopup &&
    typeof root.welcomePopup === 'object' &&
    !Array.isArray(root.welcomePopup)
      ? (root.welcomePopup as Record<string, unknown>)
      : {};
  const rawConcierge =
    root.concierge && typeof root.concierge === 'object' && !Array.isArray(root.concierge)
      ? (root.concierge as Record<string, unknown>)
      : {};
  const rawBrand =
    root.brandFooter && typeof root.brandFooter === 'object' && !Array.isArray(root.brandFooter)
      ? (root.brandFooter as Record<string, unknown>)
      : {};

  let items: ConciergeBadgeItem[];
  if (Array.isArray(rawConcierge.items)) {
    items = rawConcierge.items
      .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
      .slice(0, 12)
      .map((entry, idx) => ({
        id:
          typeof entry.id === 'string' && entry.id.trim()
            ? entry.id.trim()
            : `concierge-item-${idx + 1}`,
        icon: isIconKey(entry.icon) ? entry.icon : 'phone',
        label: mergeLocalized(entry.label, { vi: '', en: '', zh: '' }),
        highlight: mergeLocalized(entry.highlight, { vi: '', en: '', zh: '' }),
        suffix: mergeLocalized(entry.suffix, { vi: '', en: '', zh: '' }),
        href: typeof entry.href === 'string' ? (sanitizeSafeHref(entry.href) ?? '') : '',
        isActive: typeof entry.isActive === 'boolean' ? entry.isActive : true,
      }));
  } else {
    items = structuredCloneSafe(DEFAULT_FOOTER_CONFIG.concierge.items);
  }

  return {
    branding: {
      logoUrl: sanitizeImageUrl(rawBranding.logoUrl),
      logoFrame: isLogoFrameStyle(rawBranding.logoFrame)
        ? rawBranding.logoFrame
        : DEFAULT_FOOTER_CONFIG.branding.logoFrame,
      brandTitle:
        typeof rawBranding.brandTitle === 'string' && rawBranding.brandTitle.trim()
          ? rawBranding.brandTitle.trim()
          : DEFAULT_FOOTER_CONFIG.branding.brandTitle,
      brandSubtitle: mergeLocalized(
        rawBranding.brandSubtitle,
        DEFAULT_FOOTER_CONFIG.branding.brandSubtitle
      ),
    },
    welcomePopup: {
      enabled:
        typeof rawWelcomePopup.enabled === 'boolean'
          ? rawWelcomePopup.enabled
          : DEFAULT_FOOTER_CONFIG.welcomePopup.enabled,
      frequency: isPopupFrequency(rawWelcomePopup.frequency)
        ? rawWelcomePopup.frequency
        : DEFAULT_FOOTER_CONFIG.welcomePopup.frequency,
      imageUrl: sanitizeImageUrl(rawWelcomePopup.imageUrl),
      badge: mergeLocalized(
        rawWelcomePopup.badge,
        DEFAULT_FOOTER_CONFIG.welcomePopup.badge
      ),
      title: mergeLocalized(
        rawWelcomePopup.title,
        DEFAULT_FOOTER_CONFIG.welcomePopup.title
      ),
      message: mergeLocalized(
        rawWelcomePopup.message,
        DEFAULT_FOOTER_CONFIG.welcomePopup.message
      ),
      ctaLabel: mergeLocalized(
        rawWelcomePopup.ctaLabel,
        DEFAULT_FOOTER_CONFIG.welcomePopup.ctaLabel
      ),
      showLanguagePicker:
        typeof rawWelcomePopup.showLanguagePicker === 'boolean'
          ? rawWelcomePopup.showLanguagePicker
          : DEFAULT_FOOTER_CONFIG.welcomePopup.showLanguagePicker,
      showWifiQuickCopy:
        typeof rawWelcomePopup.showWifiQuickCopy === 'boolean'
          ? rawWelcomePopup.showWifiQuickCopy
          : DEFAULT_FOOTER_CONFIG.welcomePopup.showWifiQuickCopy,
    },
    concierge: {
      enabled:
        typeof rawConcierge.enabled === 'boolean'
          ? rawConcierge.enabled
          : DEFAULT_FOOTER_CONFIG.concierge.enabled,
      showOnAllPages:
        typeof rawConcierge.showOnAllPages === 'boolean'
          ? rawConcierge.showOnAllPages
          : DEFAULT_FOOTER_CONFIG.concierge.showOnAllPages,
      icon: isIconKey(rawConcierge.icon)
        ? rawConcierge.icon
        : DEFAULT_FOOTER_CONFIG.concierge.icon,
      title: mergeLocalized(rawConcierge.title, DEFAULT_FOOTER_CONFIG.concierge.title),
      subtitle: mergeLocalized(rawConcierge.subtitle, DEFAULT_FOOTER_CONFIG.concierge.subtitle),
      items,
    },
    brandFooter: {
      enabled:
        typeof rawBrand.enabled === 'boolean'
          ? rawBrand.enabled
          : DEFAULT_FOOTER_CONFIG.brandFooter.enabled,
      resortName: mergeLocalized(
        rawBrand.resortName,
        DEFAULT_FOOTER_CONFIG.brandFooter.resortName
      ),
      welcomeText: mergeLocalized(
        rawBrand.welcomeText,
        DEFAULT_FOOTER_CONFIG.brandFooter.welcomeText
      ),
      copyrightText: mergeLocalized(
        rawBrand.copyrightText,
        DEFAULT_FOOTER_CONFIG.brandFooter.copyrightText
      ),
      address: mergeLocalized(rawBrand.address, DEFAULT_FOOTER_CONFIG.brandFooter.address),
      hotline:
        typeof rawBrand.hotline === 'string'
          ? rawBrand.hotline
          : DEFAULT_FOOTER_CONFIG.brandFooter.hotline,
      email:
        typeof rawBrand.email === 'string'
          ? rawBrand.email
          : DEFAULT_FOOTER_CONFIG.brandFooter.email,
    },
  };
}

function structuredCloneSafe<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}
