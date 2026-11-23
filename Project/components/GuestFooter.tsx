'use client';

import { usePathname } from 'next/navigation';
import { FiMapPin, FiPhoneCall, FiMail } from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import ConciergeBar from './ConciergeBar';
import type { Language } from '@/lib/i18n';
import { getCurrentYearVN } from '@/lib/locale';
import {
  DEFAULT_FOOTER_CONFIG,
  formatPhoneHref,
  resolveLocalizedText,
  type FooterConfig,
} from '@/lib/footer-config';

interface GuestFooterProps {
  config?: FooterConfig;
  token?: string;
  languageOverride?: Language;
  isPreview?: boolean;
}

export default function GuestFooter({
  config = DEFAULT_FOOTER_CONFIG,
  token,
  languageOverride,
  isPreview = false,
}: GuestFooterProps) {
  const { language: ctxLanguage } = useLanguage();
  const pathname = usePathname();
  const language = languageOverride ?? ctxLanguage;
  const year = getCurrentYearVN();

  const isHomePage = isPreview
    ? true
    : token
    ? pathname === `/${token}` || pathname === `/${token}/`
    : false;

  const showConcierge =
    config.concierge.enabled && (config.concierge.showOnAllPages || isHomePage);

  const showBrandFooter = config.brandFooter.enabled;

  if (!showConcierge && !showBrandFooter) {
    return null;
  }

  const resortName = resolveLocalizedText(language, config.brandFooter.resortName);
  const welcomeText = resolveLocalizedText(language, config.brandFooter.welcomeText);
  const copyrightRaw = resolveLocalizedText(language, config.brandFooter.copyrightText);
  const copyrightText = copyrightRaw.replace(/\{year\}/g, String(year));
  const address = resolveLocalizedText(language, config.brandFooter.address);
  const hotline = (config.brandFooter.hotline ?? '').trim();
  const email = (config.brandFooter.email ?? '').trim();
  const phoneHref = hotline ? formatPhoneHref(hotline) : '';

  const hasContactRow = Boolean(address || hotline || email);

  return (
    <>
      {showConcierge && (
        <div
          className={
            isPreview
              ? 'w-full'
              : `container mx-auto px-3 sm:px-6 lg:px-8 mt-2 sm:mt-4 ${
                  !showBrandFooter ? 'mb-6 sm:mb-10' : ''
                }`
          }
        >
          <div className={isPreview ? '' : 'max-w-6xl mx-auto'}>
            <ConciergeBar
              config={config.concierge}
              languageOverride={languageOverride}
            />
          </div>
        </div>
      )}

      {showBrandFooter && (
        <footer
          className={`border-t border-[#D5C9B2] bg-white/85 text-center text-xs text-slate-700 ${
            isPreview ? 'py-6 mt-5 rounded-b-2xl' : 'py-6 sm:py-9 mt-6 sm:mt-12'
          }`}
        >
          <div className="container mx-auto px-4 space-y-2">
            {resortName && (
              <p className="font-serif tracking-[0.16em] text-slate-900 uppercase font-bold text-sm">
                {resortName}
              </p>
            )}
            {welcomeText && (
              <p className="text-[#6E4E12] text-[11px] font-bold tracking-wider">
                {welcomeText}
              </p>
            )}

            {hasContactRow && (
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-800 pt-1">
                {address && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiMapPin className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                    <span>{address}</span>
                  </span>
                )}
                {hotline &&
                  (phoneHref ? (
                    <a
                      href={phoneHref}
                      className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-[#6E4E12] underline underline-offset-2 transition-colors"
                    >
                      <FiPhoneCall className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                      <span>{hotline}</span>
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <FiPhoneCall className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                      <span>{hotline}</span>
                    </span>
                  ))}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-900 hover:text-[#6E4E12] transition-colors"
                  >
                    <FiMail className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                    <span>{email}</span>
                  </a>
                )}
              </div>
            )}

            {copyrightText && (
              <p className="text-slate-600 text-[11px] font-medium pt-0.5">
                {copyrightText}
              </p>
            )}
          </div>
        </footer>
      )}
    </>
  );
}
