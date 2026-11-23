'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiBookOpen,
  FiMap,
  FiStar,
  FiInfo,
  FiMessageSquare,
  FiAward,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { getTranslation } from '@/lib/i18n';
import {
  DEFAULT_FOOTER_CONFIG,
  resolveLocalizedText,
  type BrandingConfig,
  type LogoFrameStyle,
} from '@/lib/footer-config';

interface NavigationProps {
  token: string;
  allowedModules: string[];
  branding?: BrandingConfig;
}

export function BrandLogoMark({
  logoUrl,
  logoFrame = 'none',
  alt = 'HOA GIANG',
  size = 'nav',
}: {
  logoUrl?: string;
  logoFrame?: LogoFrameStyle;
  alt?: string;
  size?: 'nav' | 'sidebar' | 'preview';
}) {
  const sizeClass =
    size === 'sidebar'
      ? 'w-10 h-10'
      : size === 'preview'
      ? 'w-11 h-11'
      : 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10';

  if (logoUrl) {
    if (logoFrame === 'dark') {
      return (
        <div
          className={`${sizeClass} rounded-xl bg-[#0F172A] border border-[#C5A456]/60 p-1 flex items-center justify-center shadow-sm shrink-0 overflow-hidden`}
        >
          <img
            src={logoUrl}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    if (logoFrame === 'light') {
      return (
        <div
          className={`${sizeClass} rounded-xl bg-white border border-[#CFC3AC] p-1 flex items-center justify-center shadow-sm shrink-0 overflow-hidden`}
        >
          <img
            src={logoUrl}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // 'none': clean frameless display that preserves logo silhouette & transparency
    const framelessSize =
      size === 'sidebar'
        ? 'h-10 max-w-[48px]'
        : size === 'preview'
        ? 'h-11 max-w-[60px]'
        : 'h-8 sm:h-9 md:h-10 max-w-[44px] sm:max-w-[56px]';

    return (
      <div className={`${framelessSize} flex items-center justify-center shrink-0`}>
        <img
          src={logoUrl}
          alt={alt}
          className="max-h-full max-w-full w-auto h-auto object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-xl bg-[#0F172A] border border-[#C5A456]/60 flex items-center justify-center text-[#E8CA7A] shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
    >
      <FiAward className="w-4 h-4 md:w-5 md:h-5" />
    </div>
  );
}

interface NavItem {
  key: string;
  path: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const MODULE_ORDER = ['menu', 'services', 'information', 'floor-plan'];

const moduleRoutes: Record<string, NavItem> = {
  menu: { key: 'menu', path: '/menu', labelKey: 'menu', icon: FiBookOpen },
  services: { key: 'services', path: '/services', labelKey: 'services', icon: FiStar },
  information: { key: 'information', path: '/information', labelKey: 'information', icon: FiInfo },
  'floor-plan': { key: 'floor-plan', path: '/floor-plan', labelKey: 'floor_plan', icon: FiMap },
};

const homeRoute: NavItem = {
  key: 'home',
  path: '',
  labelKey: 'home',
  icon: FiHome,
  exact: true,
};

// Feedback is available to every valid guest QR code (not a DB module).
const feedbackRoute: NavItem = {
  key: 'feedback',
  path: '/feedback',
  labelKey: 'feedback',
  icon: FiMessageSquare,
};

export default function Navigation({
  token,
  allowedModules,
  branding = DEFAULT_FOOTER_CONFIG.branding,
}: NavigationProps) {
  const pathname = usePathname();
  const { language } = useLanguage();

  const brandTitle = (branding.brandTitle || 'HOA GIANG').trim();
  const brandSubtitle = resolveLocalizedText(
    language,
    branding.brandSubtitle,
    getTranslation(language, 'resort_subtitle')
  );

  const sortedAllowed = [...allowedModules].sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a);
    const ib = MODULE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const moduleNavItems = sortedAllowed
    .map((mod) => moduleRoutes[mod])
    .filter((item): item is NavItem => Boolean(item));

  const desktopRoutes: NavItem[] = [...moduleNavItems, feedbackRoute];

  // Bottom tab bar supports up to 5 thumb-friendly tabs cleanly.
  const feedbackInBottomBar = moduleNavItems.length <= 3;
  const mobileBottomRoutes: NavItem[] = [
    homeRoute,
    ...moduleNavItems.slice(0, 4),
    ...(feedbackInBottomBar ? [feedbackRoute] : []),
  ];

  const isRouteActive = (item: NavItem) => {
    const full = `/${token}${item.path}`;
    if (item.exact) {
      return pathname === full || pathname === `${full}/`;
    }
    return pathname === full || pathname?.startsWith(`${full}/`);
  };

  const isFeedbackActive = isRouteActive(feedbackRoute);

  return (
    <>
      <nav className="luxury-glass sticky top-0 z-40 border-b border-[#D5C9B2] shadow-[0_1px_12px_rgba(15,23,42,0.06)]">
        <div className="container mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 h-[54px] md:h-[72px]">
            {/* Resort Brand Lockup — Full "HÒA BÌNH RẠCH GIÁ RESORT" + Custom Logo */}
            <Link
              href={`/${token}`}
              className="flex items-center gap-2 min-w-0 group shrink"
            >
              <BrandLogoMark
                logoUrl={branding.logoUrl}
                logoFrame={branding.logoFrame}
                alt={brandTitle}
                size="nav"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-[14px] sm:text-[16px] md:text-lg font-bold tracking-[0.1em] sm:tracking-[0.12em] text-slate-900 group-hover:text-[#6E4E12] transition-colors leading-tight whitespace-nowrap truncate">
                  {brandTitle}
                </span>
                <span className="text-[8.5px] min-[390px]:text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.04em] sm:tracking-[0.12em] text-[#6E4E12] font-extrabold leading-tight whitespace-nowrap truncate">
                  {brandSubtitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1.5 lg:gap-2 shrink-0">
              {desktopRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = isRouteActive(route);
                return (
                  <Link
                    key={route.key}
                    href={`/${token}${route.path}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs uppercase tracking-wider font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0F172A] text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-[#F3EFE6]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-[#E8CA7A]' : 'text-[#6E4E12]'
                      }`}
                    />
                    <span>{getTranslation(language, route.labelKey)}</span>
                  </Link>
                );
              })}

              <div className="pl-2.5 ml-1.5 border-l border-[#D5C9B2]">
                <LanguageSwitcher />
              </div>
            </div>

            {/* Mobile Right Utility Controls */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {!feedbackInBottomBar && (
                <Link
                  href={`/${token}/feedback`}
                  aria-label={getTranslation(language, 'feedback')}
                  aria-current={isFeedbackActive ? 'page' : undefined}
                  className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 min-[420px]:w-auto min-[420px]:px-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap shrink-0 active:scale-[0.97] ${
                    isFeedbackActive
                      ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                      : 'bg-white text-slate-800 border-[#C9B483] hover:bg-[#FBF6E8]'
                  }`}
                >
                  <FiMessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isFeedbackActive ? 'text-[#E8CA7A]' : 'text-[#6E4E12]'
                    }`}
                  />
                  <span className="hidden min-[420px]:inline">
                    {getTranslation(language, 'feedback')}
                  </span>
                </Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>

      {/* Persistent Mobile Thumb-Zone Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#D5C9B2] shadow-[0_-4px_18px_rgba(15,23,42,0.09)] pb-safe"
      >
        <div
          className="grid items-stretch h-[58px] max-w-lg mx-auto px-1"
          style={{
            gridTemplateColumns: `repeat(${mobileBottomRoutes.length}, minmax(0, 1fr))`,
          }}
        >
          {mobileBottomRoutes.map((route) => {
            const Icon = route.icon;
            const isActive = isRouteActive(route);
            return (
              <Link
                key={route.key}
                href={`/${token}${route.path}`}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center gap-0.5 px-0.5 transition-colors active:scale-95"
              >
                <span
                  className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                    isActive
                      ? 'bg-[#0F172A] text-[#E8CA7A] shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span
                  className={`text-[10.5px] leading-tight truncate max-w-full ${
                    isActive
                      ? 'font-bold text-slate-900'
                      : 'font-semibold text-slate-600'
                  }`}
                >
                  {getTranslation(language, route.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
