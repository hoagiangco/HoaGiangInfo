'use client';

import Link from 'next/link';
import {
  FiBookOpen,
  FiMap,
  FiStar,
  FiInfo,
  FiMessageSquare,
  FiArrowRight,
  FiCompass,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';
import {
  getExactTranslation,
  getLocalizedValue,
  type ModuleTranslationFields,
} from '@/lib/translations';

export interface HomeModuleItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  translations?: unknown;
  icon: string | null;
  route: string;
}

interface ModuleCardProps {
  module: HomeModuleItem;
  token: string;
  countLabel?: string;
  /** On mobile 2-col grids, 'banner' spans 2 cols horizontally to prevent orphan cards. */
  variant?: 'tile' | 'banner';
}

const moduleMeta: Record<
  string,
  {
    tagKey: string;
    titleKey: string;
    fallbackDescKey: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBoxClass: string;
    accentBarClass: string;
  }
> = {
  menu: {
    tagKey: 'module_tag_menu',
    titleKey: 'menu',
    fallbackDescKey: 'module_desc_menu',
    icon: FiBookOpen,
    iconBoxClass:
      'bg-[#FEF3C7] text-[#78350F] border-[#E0B55E] group-hover:bg-[#78350F] group-hover:text-white group-hover:border-[#78350F]',
    accentBarClass: 'bg-[#B47B14]',
  },
  services: {
    tagKey: 'module_tag_services',
    titleKey: 'services',
    fallbackDescKey: 'module_desc_services',
    icon: FiStar,
    iconBoxClass:
      'bg-[#E0F2FE] text-[#0C4A6E] border-[#7CC4E8] group-hover:bg-[#0C4A6E] group-hover:text-white group-hover:border-[#0C4A6E]',
    accentBarClass: 'bg-[#0369A1]',
  },
  information: {
    tagKey: 'module_tag_information',
    titleKey: 'information',
    fallbackDescKey: 'module_desc_information',
    icon: FiInfo,
    iconBoxClass:
      'bg-[#E0E7FF] text-[#1E1B4B] border-[#A5B4FC] group-hover:bg-[#1E1B4B] group-hover:text-white group-hover:border-[#1E1B4B]',
    accentBarClass: 'bg-[#3730A3]',
  },
  'floor-plan': {
    tagKey: 'module_tag_floor_plan',
    titleKey: 'floor_plan',
    fallbackDescKey: 'module_desc_floor_plan',
    icon: FiMap,
    iconBoxClass:
      'bg-[#D1FAE5] text-[#064E3B] border-[#6EE7B7] group-hover:bg-[#064E3B] group-hover:text-white group-hover:border-[#064E3B]',
    accentBarClass: 'bg-[#047857]',
  },
  feedback: {
    tagKey: 'module_tag_feedback',
    titleKey: 'feedback_card_title',
    fallbackDescKey: 'module_desc_feedback',
    icon: FiMessageSquare,
    iconBoxClass:
      'bg-[#FFE4E6] text-[#881337] border-[#F8A5B4] group-hover:bg-[#881337] group-hover:text-white group-hover:border-[#881337]',
    accentBarClass: 'bg-[#BE123C]',
  },
};

export default function ModuleCard({
  module,
  token,
  countLabel,
  variant = 'tile',
}: ModuleCardProps) {
  const { language } = useLanguage();
  const meta = moduleMeta[module.name] || {
    tagKey: 'module_tag_default',
    titleKey: '',
    fallbackDescKey: 'module_desc_default',
    icon: FiCompass,
    iconBoxClass:
      'bg-[#FBF6E8] text-[#6E4E12] border-[#C9B483] group-hover:bg-[#0F172A] group-hover:text-[#E8CA7A]',
    accentBarClass: 'bg-[#6E4E12]',
  };

  const Icon = meta.icon;

  let localizedTitle: string;
  let localizedDesc: string;

  if (language === 'vi') {
    localizedTitle = module.displayName;
    localizedDesc =
      module.description || getTranslation(language, meta.fallbackDescKey);
  } else {
    const exactTitle = getExactTranslation<ModuleTranslationFields>(
      language,
      module.translations,
      'displayName'
    );
    const exactDesc = getExactTranslation<ModuleTranslationFields>(
      language,
      module.translations,
      'description'
    );

    if (module.name === 'feedback') {
      localizedTitle = module.displayName;
      localizedDesc =
        module.description || getTranslation(language, meta.fallbackDescKey);
    } else {
      localizedTitle =
        exactTitle ||
        (meta.titleKey
          ? getTranslation(language, meta.titleKey)
          : getLocalizedValue<ModuleTranslationFields>(
              language,
              module.displayName,
              module.translations,
              'displayName'
            ));

      localizedDesc =
        exactDesc ||
        (meta.titleKey
          ? getTranslation(language, meta.fallbackDescKey)
          : getLocalizedValue<ModuleTranslationFields>(
              language,
              module.description,
              module.translations,
              'description'
            ) || getTranslation(language, meta.fallbackDescKey));
    }
  }

  // Horizontal compact banner on mobile (< lg) when variant === 'banner'
  if (variant === 'banner') {
    return (
      <Link
        href={`/${token}${module.route}`}
        className="group block col-span-2 lg:col-span-1 h-full active:scale-[0.98] transition-transform"
      >
        {/* Mobile & Tablet Horizontal Banner */}
        <div className="lg:hidden relative bg-white rounded-2xl p-3.5 sm:p-5 border border-[#CFC3AC] shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:border-[#0F172A] transition-all flex items-center justify-between gap-3.5 overflow-hidden">
          <span
            className={`absolute left-0 top-0 bottom-0 w-1 ${meta.accentBarClass}`}
          />
          <div className="flex items-center gap-3 min-w-0 pl-1">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${meta.iconBoxClass}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-[15px] sm:text-lg font-bold text-slate-900 leading-tight">
                {localizedTitle}
              </h3>
              <p className="text-slate-700 text-xs sm:text-sm leading-snug mt-0.5">
                {localizedDesc}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <FiArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Desktop Matching Vertical Card */}
        <div className="hidden lg:flex relative h-full bg-white rounded-2xl p-6 border border-[#CFC3AC] shadow-[0_4px_18px_rgba(15,23,42,0.06)] hover:shadow-luxury-hover hover:border-[#6E4E12] hover:-translate-y-1 transition-all duration-300 flex-col justify-between overflow-hidden">
          <span
            className={`absolute top-0 left-0 right-0 h-1 ${meta.accentBarClass}`}
          />
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#6E4E12] bg-[#FBF6E8] border border-[#D8C59A] px-2.5 py-1 rounded-full">
                {getTranslation(language, meta.tagKey)}
              </span>
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-300 ${meta.iconBoxClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900 mb-2 tracking-tight group-hover:text-[#6E4E12] transition-colors">
              {localizedTitle}
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed mb-5 line-clamp-2">
              {localizedDesc}
            </p>
          </div>
          <div className="pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold tracking-wider uppercase text-slate-900 group-hover:text-[#6E4E12]">
            <span>{getTranslation(language, 'explore_now')}</span>
            <div className="w-7 h-7 rounded-full bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <FiArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${token}${module.route}`}
      className="group block h-full active:scale-[0.98] transition-transform"
    >
      <div className="relative h-full bg-white rounded-2xl p-3 sm:p-5 lg:p-6 border border-[#CFC3AC] shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:shadow-luxury-hover hover:border-[#6E4E12] md:hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden">
        {/* Crisp top color indicator bar for instant visual recognition */}
        <span
          className={`absolute top-0 left-0 right-0 h-1 ${meta.accentBarClass}`}
        />

        <div>
          {/* Top Row: Distinct Icon + Count / Tag Pill */}
          <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-4 pt-0.5">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 ${meta.iconBoxClass}`}
            >
              <Icon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </div>

            {countLabel ? (
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 bg-[#F3EFE6] border border-[#CFC3AC] px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                {countLabel}
              </span>
            ) : (
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E4E12] bg-[#FBF6E8] border border-[#D8C59A] px-2.5 py-0.5 rounded-full truncate max-w-[140px]">
                {getTranslation(language, meta.tagKey)}
              </span>
            )}
          </div>

          {/* High-Contrast Title */}
          <h3 className="font-serif text-[14.5px] sm:text-xl font-bold text-slate-900 leading-tight tracking-tight group-hover:text-[#6E4E12] transition-colors">
            {localizedTitle}
          </h3>

          {/* Concise High-Contrast Description */}
          <p className="text-slate-700 text-[11.5px] sm:text-sm leading-snug sm:leading-relaxed mt-1 sm:mt-2 line-clamp-2">
            {localizedDesc}
          </p>
        </div>

        {/* Clean Action Footer */}
        <div className="pt-2 sm:pt-3.5 mt-2.5 sm:mt-4 border-t border-slate-200/80 flex items-center justify-between gap-1 text-[10px] sm:text-xs font-extrabold tracking-normal sm:tracking-wide uppercase text-[#6E4E12] group-hover:text-slate-900">
          <span className="truncate">{getTranslation(language, 'explore_now')}</span>
          <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <FiArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
