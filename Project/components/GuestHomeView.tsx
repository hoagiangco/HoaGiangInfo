'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiWifi, FiCopy, FiCheck, FiPhoneCall } from 'react-icons/fi';
import ModuleCard, { type HomeModuleItem } from './ModuleCard';
import WelcomePopup from './WelcomePopup';
import { useLanguage } from './LanguageProvider';
import { getTranslation, type Language } from '@/lib/i18n';
import type { BrandingConfig, WelcomePopupConfig } from '@/lib/footer-config';

export interface HomeWifiQuickInfo {
  infoId: string;
  ssid: Record<Language, string>;
  password: Record<Language, string>;
}

export interface HomeReceptionQuickInfo {
  hotlineDisplay: string | null;
  phoneHref: string | null;
  dialExt: string | null;
}

export interface HomeModuleCounts {
  menu: number;
  services: number;
  information: number;
  'floor-plan': number;
}

interface GuestHomeViewProps {
  token: string;
  modules: HomeModuleItem[];
  counts: HomeModuleCounts;
  wifi: HomeWifiQuickInfo | null;
  reception: HomeReceptionQuickInfo;
  hasInfoModule: boolean;
  branding: BrandingConfig;
  welcomePopup: WelcomePopupConfig;
}

export default function GuestHomeView({
  token,
  modules,
  counts,
  wifi,
  reception,
  hasInfoModule,
  branding,
  welcomePopup,
}: GuestHomeViewProps) {
  const { language } = useLanguage();
  const [copiedWifi, setCopiedWifi] = useState(false);

  const activeSsid = wifi ? wifi.ssid[language] || wifi.ssid.vi : '';
  const activePassword = wifi ? wifi.password[language] || wifi.password.vi : '';
  const hasWifiCard = Boolean(wifi);
  const hasWifiPassword = Boolean(activePassword);

  async function handleCopyWifi() {
    if (!activePassword) return;
    try {
      await navigator.clipboard.writeText(activePassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2200);
    } catch {
      // Fallback for non-HTTPS local testing
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
        setTimeout(() => setCopiedWifi(false), 2200);
      } catch {
        // Ignore clipboard errors
      }
    }
  }

  function getCountLabel(moduleName: string): string | undefined {
    if (moduleName === 'menu' && counts.menu > 0) {
      return getTranslation(language, 'module_count_menu', { count: counts.menu });
    }
    if (moduleName === 'services' && counts.services > 0) {
      return getTranslation(language, 'module_count_services', {
        count: counts.services,
      });
    }
    if (moduleName === 'information' && counts.information > 0) {
      return getTranslation(language, 'module_count_information', {
        count: counts.information,
      });
    }
    if (moduleName === 'floor-plan' && counts['floor-plan'] > 0) {
      return getTranslation(language, 'module_count_floor_plan', {
        count: counts['floor-plan'],
      });
    }
    return undefined;
  }

  // If the number of DB modules is even (e.g. 4), rendering Feedback as a full-width mobile banner
  // keeps the 2-column mobile grid perfectly symmetrical with zero awkward orphan gaps.
  const feedbackAsBanner = modules.length % 2 === 0;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-3 sm:space-y-6">
      {/* First-arrival QR Welcome Popup */}
      <WelcomePopup
        token={token}
        config={welcomePopup}
        branding={branding}
        wifi={wifi}
      />

      {/* Compact High-Contrast Dark Navy Resort Welcome Card — Tuned for 360x800 Android */}
      <section className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#152238] to-[#0B1120] text-white border border-[#C5A456]/45 shadow-[0_8px_24px_rgba(15,23,42,0.16)] overflow-hidden">
        {/* Subtle luminous gold hairline accent */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#8A641A] via-[#E8CA7A] to-[#8A641A]" />

        <div className="px-3.5 py-3 sm:px-7 sm:py-6 space-y-2.5 sm:space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase text-[#E8CA7A] leading-snug">
              <span>★ ★ ★ ★</span>
              <span className="text-slate-200 ml-0.5">
                {getTranslation(language, 'hero_badge')}
              </span>
            </div>
            <h1 className="font-serif text-[19px] sm:text-3xl lg:text-[34px] font-semibold text-white tracking-tight leading-tight mt-0.5 sm:mt-1">
              <span className="sm:hidden">
                {getTranslation(language, 'resort_name')}
              </span>
              <span className="hidden sm:inline">
                {getTranslation(language, 'hero_title')}
              </span>
            </h1>
            <p className="text-slate-200 text-[11.5px] sm:text-sm leading-snug mt-0.5 sm:mt-1 max-w-2xl">
              <span className="sm:hidden">
                {getTranslation(language, 'hero_compact_subtitle')}
              </span>
              <span className="hidden sm:inline">
                {getTranslation(language, 'hero_subtitle')}
              </span>
            </p>
          </div>

          {/* Instant Utility Strip: Zero-Truncation Wi-Fi Quick Copy + Single-Line Reception on 360px */}
          {(hasWifiCard || reception.hotlineDisplay || reception.dialExt) && (
            <div
              className={`grid gap-2 sm:gap-3 ${
                hasWifiCard ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:max-w-sm'
              }`}
            >
              {/* 1-Tap Wi-Fi Quick Copy — Unified left-aligned icon + 2-line text layout on both Mobile & Desktop */}
              {hasWifiCard &&
                (hasWifiPassword ? (
                  <div className="flex items-center justify-between gap-2 bg-white/10 border border-white/15 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E8CA7A]/15 border border-[#E8CA7A]/35 text-[#E8CA7A] flex items-center justify-center shrink-0">
                        <FiWifi className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] sm:text-[11px] leading-snug tracking-wide break-words">
                          {activeSsid ? (
                            <>
                              <span className="text-[#E8CA7A] font-bold uppercase mr-1">
                                Wi-Fi:
                              </span>
                              <span className="text-white font-bold">
                                {activeSsid}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-300 font-semibold uppercase">
                              {getTranslation(language, 'quick_wifi_label')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm leading-snug mt-0.5 break-all">
                          <span className="text-slate-300 font-medium mr-1">
                            {getTranslation(language, 'quick_wifi_password')}:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {activePassword}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyWifi}
                      aria-label={getTranslation(language, 'info_copy')}
                      className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg text-[11px] font-extrabold transition-all shrink-0 active:scale-95 ${
                        copiedWifi
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-[#E8CA7A] hover:bg-[#F3DA94] text-[#0F172A]'
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
                ) : (
                  <Link
                    href={`/${token}/information/${wifi!.infoId}`}
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E8CA7A]/15 border border-[#E8CA7A]/35 text-[#E8CA7A] flex items-center justify-center shrink-0">
                        <FiWifi className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-[#E8CA7A] font-bold leading-snug truncate">
                          {getTranslation(language, 'quick_wifi_label')}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-white leading-snug mt-0.5 truncate">
                          {activeSsid || getTranslation(language, 'wifi_password')}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center h-8 px-2.5 sm:px-3 rounded-lg bg-[#E8CA7A] text-[#0F172A] text-[11px] font-extrabold shrink-0">
                      {getTranslation(language, 'view')}
                    </span>
                  </Link>
                ))}

              {/* Reception Hotline / Dial Quick Chip — Aligned vertically with Wi-Fi icon box above */}
              {(reception.hotlineDisplay || reception.dialExt) &&
                (reception.phoneHref ? (
                  <a
                    href={reception.phoneHref}
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E8CA7A]/15 border border-[#E8CA7A]/35 text-[#E8CA7A] flex items-center justify-center shrink-0">
                        <FiPhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex items-center gap-1.5 sm:block">
                        <p className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-300 font-semibold leading-snug truncate">
                          {getTranslation(language, 'quick_reception')}
                        </p>
                        <span className="sm:hidden text-slate-400">·</span>
                        <p className="text-xs sm:text-sm font-bold text-white leading-snug sm:mt-0.5 truncate">
                          {reception.hotlineDisplay}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center h-8 px-2.5 sm:px-3 rounded-lg bg-white text-[#0F172A] text-[11px] font-extrabold shrink-0">
                      {getTranslation(language, 'quick_call_now')}
                    </span>
                  </a>
                ) : hasInfoModule ? (
                  <Link
                    href={`/${token}/information`}
                    className="flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E8CA7A]/15 border border-[#E8CA7A]/35 text-[#E8CA7A] flex items-center justify-center shrink-0">
                        <FiPhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </span>
                      <div className="min-w-0 flex items-center gap-1.5 sm:block">
                        <p className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-300 font-semibold leading-snug truncate">
                          {getTranslation(language, 'quick_reception')}
                        </p>
                        <span className="sm:hidden text-slate-400">·</span>
                        <p className="text-xs sm:text-sm font-bold text-white leading-snug sm:mt-0.5 truncate">
                          {getTranslation(language, 'quick_dial_ext', {
                            ext: reception.dialExt || '100',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center h-8 px-2.5 sm:px-3 rounded-lg bg-white/15 text-white text-[11px] font-bold shrink-0">
                      {getTranslation(language, 'view')}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-2.5 bg-white/10 border border-white/15 rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E8CA7A]/15 border border-[#E8CA7A]/35 text-[#E8CA7A] flex items-center justify-center shrink-0">
                      <FiPhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <div className="min-w-0 flex items-center gap-1.5 sm:block">
                      <p className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-slate-300 font-semibold leading-snug truncate">
                        {getTranslation(language, 'quick_reception')}
                      </p>
                      <span className="sm:hidden text-slate-400">·</span>
                      <p className="text-xs sm:text-sm font-bold text-white leading-snug sm:mt-0.5 truncate">
                        {getTranslation(language, 'quick_dial_ext', {
                          ext: reception.dialExt || '100',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* High-Density 2-Column Mobile / 3-Column Desktop Action Hub */}
      <section aria-label={getTranslation(language, 'select_service')}>
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-[#CFC3AC]">
            <p className="font-serif text-base font-semibold text-slate-800">
              {getTranslation(language, 'no_modules')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                token={token}
                countLabel={getCountLabel(mod.name)}
                variant="tile"
              />
            ))}

            {/* Seamless Guest Feedback Card — Full-width banner on mobile when modules count is even */}
            <ModuleCard
              token={token}
              variant={feedbackAsBanner ? 'banner' : 'tile'}
              module={{
                id: 'feedback',
                name: 'feedback',
                displayName: getTranslation(language, 'feedback_card_title'),
                description: getTranslation(language, 'feedback_card_desc'),
                icon: null,
                route: '/feedback',
              }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
