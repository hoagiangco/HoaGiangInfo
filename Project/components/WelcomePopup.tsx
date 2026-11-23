'use client';

import { useEffect, useState } from 'react';
import {
  FiX,
  FiArrowRight,
  FiWifi,
  FiCopy,
  FiCheck,
  FiGlobe,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { BrandLogoMark } from './Navigation';
import {
  languages,
  languageNames,
  getTranslation,
  type Language,
} from '@/lib/i18n';
import {
  resolveLocalizedText,
  type BrandingConfig,
  type WelcomePopupConfig,
} from '@/lib/footer-config';
import type { HomeWifiQuickInfo } from './GuestHomeView';

interface WelcomePopupProps {
  token: string;
  config: WelcomePopupConfig;
  branding: BrandingConfig;
  wifi?: HomeWifiQuickInfo | null;
  /** Admin live preview mode */
  forceOpen?: boolean;
  onCloseOverride?: () => void;
  languageOverride?: Language;
  onLanguageChangeOverride?: (lang: Language) => void;
}

export default function WelcomePopup({
  token,
  config,
  branding,
  wifi = null,
  forceOpen = false,
  onCloseOverride,
  languageOverride,
  onLanguageChangeOverride,
}: WelcomePopupProps) {
  const { language: ctxLanguage, setLanguage: ctxSetLanguage } = useLanguage();
  const language = languageOverride ?? ctxLanguage;
  const setLanguage = onLanguageChangeOverride ?? ctxSetLanguage;

  const [isOpen, setIsOpen] = useState(forceOpen);
  const [copiedWifi, setCopiedWifi] = useState(false);

  const storageKey = `hg_welcome_seen:${token}`;

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!config.enabled) {
      setIsOpen(false);
      return;
    }

    if (config.frequency === 'always') {
      setIsOpen(true);
      return;
    }

    // Default 'session': show once per QR scan / browser session
    try {
      const seen = window.sessionStorage.getItem(storageKey);
      if (!seen) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, [config.enabled, config.frequency, forceOpen, storageKey]);

  // Lock page scroll & support Escape key while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleClose() {
    if (!forceOpen && config.frequency === 'session') {
      try {
        window.sessionStorage.setItem(storageKey, '1');
      } catch {
        // Ignore storage errors in restricted WebViews
      }
    }
    setIsOpen(false);
    onCloseOverride?.();
  }

  if (!isOpen) return null;

  const badgeText = resolveLocalizedText(language, config.badge);
  const titleText = resolveLocalizedText(
    language,
    config.title,
    getTranslation(language, 'resort_name')
  );
  const messageText = resolveLocalizedText(language, config.message);
  const ctaText = resolveLocalizedText(
    language,
    config.ctaLabel,
    getTranslation(language, 'explore_now')
  );

  const activeSsid = wifi ? wifi.ssid[language] || wifi.ssid.vi : '';
  const activePassword = wifi ? wifi.password[language] || wifi.password.vi : '';
  const showWifi = Boolean(config.showWifiQuickCopy && activePassword);

  async function handleCopyWifi() {
    if (!activePassword) return;
    try {
      await navigator.clipboard.writeText(activePassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = activePassword;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedWifi(true);
        setTimeout(() => setCopiedWifi(false), 2000);
      } catch {
        // Ignore clipboard errors
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-5 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[344px] sm:max-w-md bg-white rounded-3xl border border-[#C9B483] shadow-[0_24px_60px_rgba(15,23,42,0.45)] overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label={getTranslation(language, 'close')}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-white/25 flex items-center justify-center backdrop-blur-sm transition-colors active:scale-95"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* Top Luxury Visual Header: Optional Uploaded Image OR Signature Deep Navy Crest */}
        {config.imageUrl ? (
          <div className="relative h-40 sm:h-48 w-full bg-[#0F172A] shrink-0 overflow-hidden">
            <img
              src={config.imageUrl}
              alt={titleText}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/35 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5">
              <BrandLogoMark
                logoUrl={branding.logoUrl}
                logoFrame={branding.logoUrl ? 'light' : 'dark'}
                alt={branding.brandTitle || 'Logo'}
                size="nav"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#E8CA7A] leading-snug">
                  ★ ★ ★ ★ {badgeText}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-[#0F172A] via-[#152238] to-[#0B1120] px-5 pt-5 pb-4 text-center shrink-0">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#8A641A] via-[#E8CA7A] to-[#8A641A]" />
            <div className="flex justify-center mb-2.5">
              <BrandLogoMark
                logoUrl={branding.logoUrl}
                logoFrame={
                  branding.logoUrl
                    ? branding.logoFrame === 'none'
                      ? 'light'
                      : branding.logoFrame
                    : 'dark'
                }
                alt={branding.brandTitle || 'Logo'}
                size="preview"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#E8CA7A] leading-snug">
              <span>★ ★ ★ ★</span>
              {badgeText && <span className="text-slate-100 ml-0.5">{badgeText}</span>}
            </div>
          </div>
        )}

        {/* High-Contrast Content Body */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 space-y-3.5 overflow-y-auto">
          <div className="text-center space-y-1.5">
            <h2
              id="welcome-popup-title"
              className="font-serif text-xl sm:text-2xl font-bold text-slate-900 leading-tight"
            >
              {titleText}
            </h2>
            {messageText && (
              <p className="text-[13px] sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {messageText}
              </p>
            )}
          </div>

          {/* Optional Instant 1-Tap Wi-Fi Copy right inside Welcome Popup */}
          {showWifi && (
            <div className="flex items-center justify-between gap-2 bg-[#F3EFE6] border border-[#C9B483] rounded-xl px-3 py-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-7 h-7 rounded-lg bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0">
                  <FiWifi className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] leading-snug break-words">
                    <span className="text-[#6E4E12] font-extrabold uppercase mr-1">
                      Wi-Fi:
                    </span>
                    <span className="text-slate-900 font-bold">
                      {activeSsid || getTranslation(language, 'quick_wifi_label')}
                    </span>
                  </p>
                  <p className="text-xs leading-snug mt-0.5 break-all">
                    <span className="text-slate-600 font-medium mr-1">
                      {getTranslation(language, 'quick_wifi_password')}:
                    </span>
                    <code className="font-mono font-extrabold text-slate-900">
                      {activePassword}
                    </code>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWifi}
                className={`inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-extrabold transition-all shrink-0 active:scale-95 ${
                  copiedWifi
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A]'
                }`}
              >
                {copiedWifi ? (
                  <>
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>{getTranslation(language, 'info_copied')}</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-3.5 h-3.5" />
                    <span>{getTranslation(language, 'info_copy')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Optional Quick Language Switcher for International Guests */}
          {config.showLanguagePicker && (
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              <FiGlobe className="w-3.5 h-3.5 text-[#6E4E12] shrink-0 mr-0.5" />
              {languages.map((lang) => {
                const active = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`h-8 px-2.5 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
                      active
                        ? 'bg-[#0F172A] text-[#E8CA7A] border-[#0F172A] shadow-sm'
                        : 'bg-[#F3EFE6] text-slate-800 border-[#CFC3AC] hover:border-[#0F172A]'
                    }`}
                  >
                    {languageNames[lang]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Primary High-Contrast CTA Button */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-11 sm:h-12 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A] text-xs font-extrabold uppercase tracking-[0.16em] shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>{ctaText}</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
