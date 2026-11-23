'use client';

import {
  FiPhoneCall,
  FiClock,
  FiShield,
  FiMail,
  FiMapPin,
  FiWifi,
  FiMessageCircle,
  FiInfo,
  FiHeart,
  FiStar,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import type { Language } from '@/lib/i18n';
import {
  resolveBadgeParts,
  resolveLocalizedText,
  sanitizeSafeHref,
  type FooterConfig,
  type FooterIconKey,
} from '@/lib/footer-config';

const ICON_MAP: Record<FooterIconKey, React.ComponentType<{ className?: string }>> = {
  phone: FiPhoneCall,
  clock: FiClock,
  shield: FiShield,
  mail: FiMail,
  'map-pin': FiMapPin,
  wifi: FiWifi,
  message: FiMessageCircle,
  info: FiInfo,
  heart: FiHeart,
  star: FiStar,
};

export function FooterIcon({
  icon,
  className,
}: {
  icon: FooterIconKey;
  className?: string;
}) {
  const IconComp = ICON_MAP[icon] ?? FiPhoneCall;
  return <IconComp className={className} />;
}

interface ConciergeBarProps {
  config: FooterConfig['concierge'];
  languageOverride?: Language;
  className?: string;
}

export default function ConciergeBar({
  config,
  languageOverride,
  className = '',
}: ConciergeBarProps) {
  const { language: ctxLanguage } = useLanguage();
  const language = languageOverride ?? ctxLanguage;

  if (!config.enabled) return null;

  const title = resolveLocalizedText(language, config.title);
  const subtitle = resolveLocalizedText(language, config.subtitle);
  const activeItems = config.items.filter((item) => {
    if (!item.isActive) return false;
    const parts = resolveBadgeParts(language, item);
    return Boolean(parts.label || parts.highlight || parts.suffix);
  });

  if (!title && !subtitle && activeItems.length === 0) return null;

  return (
    <section
      className={`bg-white rounded-2xl border border-[#CFC3AC] p-4 sm:p-6 text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-[#E8CA7A] border border-[#C5A456]/50 flex items-center justify-center shrink-0 shadow-sm">
            <FooterIcon icon={config.icon} className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            {title && (
              <h4 className="font-serif text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-xs sm:text-[13px] text-slate-700 mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {activeItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-900">
            {activeItems.map((item) => {
              const { label, highlight, suffix } = resolveBadgeParts(language, item);
              const safeHref = sanitizeSafeHref(item.href);
              const isExternal =
                safeHref?.startsWith('http://') || safeHref?.startsWith('https://');

              const content = (
                <>
                  <FooterIcon
                    icon={item.icon}
                    className="w-3.5 h-3.5 text-[#6E4E12] group-hover:text-[#E8CA7A] shrink-0 transition-colors"
                  />
                  <span className="font-medium">
                    {label}
                    {label && highlight ? ' ' : ''}
                    {highlight ? (
                      <strong className="font-extrabold text-slate-950 group-hover:text-white transition-colors">
                        {highlight}
                      </strong>
                    ) : null}
                    {(label || highlight) && suffix ? ' ' : ''}
                    {suffix}
                  </span>
                </>
              );

              if (safeHref) {
                return (
                  <a
                    key={item.id}
                    href={safeHref}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="group inline-flex items-center gap-2 min-h-[38px] bg-[#FBF6E8] hover:bg-[#0F172A] hover:text-white px-3.5 py-2 rounded-xl border border-[#C9B483] hover:border-[#0F172A] transition-all active:scale-[0.98]"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-2 min-h-[38px] bg-[#F3EFE6] px-3.5 py-2 rounded-xl border border-[#D5C9B2]"
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
