'use client';

import Link from 'next/link';
import {
  FiArrowLeft,
  FiChevronRight,
  FiMap,
  FiGlobe,
} from 'react-icons/fi';
import { MdApartment } from 'react-icons/md';
import { useLanguage } from './LanguageProvider';
import {
  getTranslation,
  languageShortLabels,
  type Language,
} from '@/lib/i18n';
import {
  getAvailableLanguages,
  getLocalizedValue,
  type FloorPlanTranslationFields,
} from '@/lib/translations';

export interface FloorPlanListItem {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
  roomsCount: number;
}

interface FloorPlanListViewProps {
  token: string;
  floorPlans: FloorPlanListItem[];
}

export default function FloorPlanListView({
  token,
  floorPlans,
}: FloorPlanListViewProps) {
  const { language } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Compact High-Contrast Page Header — Full untruncated intro text */}
      <div className="pb-3 border-b border-[#D5C9B2] space-y-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/${token}`}
            aria-label={getTranslation(language, 'back_home')}
            className="w-10 h-10 rounded-xl bg-white border border-[#CFC3AC] text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] flex items-center justify-center shrink-0 shadow-sm transition-colors active:scale-95"
          >
            <FiArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {getTranslation(language, 'floor_plan_page_title')}
            </h1>
            {floorPlans.length > 0 && (
              <span className="text-[11px] font-bold text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {getTranslation(language, 'module_count_floor_plan', {
                  count: floorPlans.length,
                })}
              </span>
            )}
          </div>
        </div>
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
          {getTranslation(language, 'floor_plan_page_subtitle')}
        </p>
      </div>

      {/* Floor Plans Grid */}
      {floorPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {floorPlans.map((floorPlan) => {
            const localizedName = getLocalizedValue<FloorPlanTranslationFields>(
              language,
              floorPlan.name,
              floorPlan.translations,
              'name'
            );
            const localizedDesc = getLocalizedValue<FloorPlanTranslationFields>(
              language,
              floorPlan.description,
              floorPlan.translations,
              'description'
            );
            const availableLangs: Language[] =
              getAvailableLanguages<FloorPlanTranslationFields>(
                floorPlan.translations,
                ['name', 'description', 'imageUrl']
              );

            return (
              <Link
                key={floorPlan.id}
                href={`/${token}/floor-plan/${floorPlan.id}`}
                className="group bg-white rounded-2xl border border-[#CFC3AC] p-4 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:border-[#0F172A] md:hover:-translate-y-0.5 hover:shadow-luxury transition-all duration-200 flex flex-col justify-between active:scale-[0.985]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <div className="w-11 h-11 rounded-xl bg-[#D1FAE5] border border-[#6EE7B7] text-[#064E3B] flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-[#E8CA7A] group-hover:border-[#0F172A] transition-colors shrink-0">
                      <MdApartment className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {availableLangs.length > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                          <FiGlobe className="w-3 h-3" />
                          {availableLangs
                            .map((l) => languageShortLabels[l])
                            .join(' / ')}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-900 bg-[#F3EFE6] border border-[#D5C9B2] px-2.5 py-0.5 rounded-full">
                        {getTranslation(language, 'floor_plan_rooms_count', {
                          count: floorPlan.roomsCount,
                        })}
                      </span>
                    </div>
                  </div>

                  <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#6E4E12] transition-colors leading-snug">
                    {localizedName}
                  </h2>

                  <p className="text-slate-700 text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1.5 mb-3 sm:mb-4">
                    {localizedDesc ||
                      getTranslation(language, 'floor_plan_default_desc')}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-[#6E4E12] group-hover:text-slate-900">
                  <span className="tracking-wider uppercase text-[11px]">
                    {getTranslation(language, 'floor_plan_view_interactive')}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <FiChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#CFC3AC] max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FBF6E8] border border-[#C9B483] text-[#6E4E12] flex items-center justify-center mx-auto">
            <FiMap className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            {getTranslation(language, 'floor_plan_empty_title')}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {getTranslation(language, 'floor_plan_empty_desc')}
          </p>
        </div>
      )}
    </div>
  );
}
