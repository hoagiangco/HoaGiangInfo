'use client';

import Link from 'next/link';
import {
  FiArrowLeft,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiStar,
} from 'react-icons/fi';
import {
  MdSpa,
  MdFitnessCenter,
  MdLocalBar,
  MdPool,
  MdRoomService,
  MdOutlineSportsTennis,
} from 'react-icons/md';
import { useLanguage } from './LanguageProvider';
import { getTranslation, translateCategory } from '@/lib/i18n';
import {
  getLocalizedValue,
  type ServiceTranslationFields,
} from '@/lib/translations';

export interface ServiceViewItem {
  id: string;
  name: string;
  type: string;
  description: string;
  translations?: unknown;
  images: string[];
  hours: string | null;
  location: string | null;
}

interface ServicesListViewProps {
  token: string;
  services: ServiceViewItem[];
}

function getServiceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('spa') || t.includes('massage')) {
    return <MdSpa className="w-6 h-6" />;
  }
  if (t.includes('gym') || t.includes('fitness')) {
    return <MdFitnessCenter className="w-6 h-6" />;
  }
  if (t.includes('bar') || t.includes('lounge') || t.includes('coffee')) {
    return <MdLocalBar className="w-6 h-6" />;
  }
  if (t.includes('pool') || t.includes('boi') || t.includes('bơi')) {
    return <MdPool className="w-6 h-6" />;
  }
  if (t.includes('tennis') || t.includes('sport')) {
    return <MdOutlineSportsTennis className="w-6 h-6" />;
  }
  if (t.includes('concierge') || t.includes('room-service')) {
    return <MdRoomService className="w-6 h-6" />;
  }
  return <FiStar className="w-6 h-6" />;
}

export default function ServicesListView({
  token,
  services,
}: ServicesListViewProps) {
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
              {getTranslation(language, 'services_page_title')}
            </h1>
            {services.length > 0 && (
              <span className="text-[11px] font-bold text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {getTranslation(language, 'module_count_services', {
                  count: services.length,
                })}
              </span>
            )}
          </div>
        </div>
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
          {getTranslation(language, 'services_page_subtitle')}
        </p>
      </div>

      {/* Services List / Grid — Scannable Mobile Cards with Hours & Location Upfront */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {services.map((service) => {
            const localizedName = getLocalizedValue<ServiceTranslationFields>(
              language,
              service.name,
              service.translations,
              'name'
            );
            const localizedDesc = getLocalizedValue<ServiceTranslationFields>(
              language,
              service.description,
              service.translations,
              'description'
            );
            const localizedHours = getLocalizedValue<ServiceTranslationFields>(
              language,
              service.hours,
              service.translations,
              'hours'
            );
            const localizedLocation = getLocalizedValue<ServiceTranslationFields>(
              language,
              service.location,
              service.translations,
              'location'
            );
            const typeLabel = translateCategory(
              language,
              'service_type_',
              service.type
            );
            const coverImage = service.images?.[0];

            return (
              <Link
                key={service.id}
                href={`/${token}/services/${service.type}`}
                className="group bg-white rounded-2xl border border-[#CFC3AC] p-3.5 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.06)] hover:border-[#0F172A] md:hover:-translate-y-0.5 hover:shadow-luxury transition-all duration-200 flex flex-col justify-between active:scale-[0.985]"
              >
                <div className="flex sm:flex-col gap-3.5 sm:gap-0">
                  {/* Thumbnail or High-Contrast Icon */}
                  <div className="flex sm:items-center sm:justify-between sm:mb-4 gap-2 shrink-0">
                    {coverImage ? (
                      <div className="w-16 h-16 sm:w-full sm:h-40 rounded-xl overflow-hidden border border-[#D5C9B2] bg-slate-100 shrink-0">
                        <img
                          src={coverImage}
                          alt={localizedName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] border border-[#7CC4E8] text-[#0C4A6E] flex items-center justify-center group-hover:bg-[#0F172A] group-hover:text-[#E8CA7A] group-hover:border-[#0F172A] transition-colors shrink-0">
                        {getServiceIcon(service.type)}
                      </div>
                    )}

                    {!coverImage && (
                      <span className="hidden sm:inline-block text-[11px] font-bold text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full uppercase tracking-wider truncate max-w-[175px]">
                        {typeLabel}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-serif text-base sm:text-xl font-bold text-slate-900 group-hover:text-[#6E4E12] transition-colors leading-snug">
                        {localizedName}
                      </h2>
                      <span className="sm:hidden w-7 h-7 rounded-full bg-[#F3EFE6] border border-[#CFC3AC] text-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                        <FiChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    <p className="text-slate-700 text-xs sm:text-sm line-clamp-2 leading-relaxed mt-1">
                      {localizedDesc ||
                        getTranslation(language, 'services_default_desc')}
                    </p>

                    {/* High-Contrast Instant Hours & Location Chips */}
                    {(localizedHours || localizedLocation) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 sm:mt-3.5">
                        {localizedHours && (
                          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-900 bg-[#F3EFE6] border border-[#D5C9B2] px-2.5 py-1 rounded-lg">
                            <FiClock className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                            <span>{localizedHours}</span>
                          </span>
                        )}
                        {localizedLocation && (
                          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-900 bg-[#F3EFE6] border border-[#D5C9B2] px-2.5 py-1 rounded-lg">
                            <FiMapPin className="w-3.5 h-3.5 text-[#6E4E12] shrink-0" />
                            <span>{localizedLocation}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop CTA Footer */}
                <div className="hidden sm:flex pt-3.5 mt-4 border-t border-slate-200/80 items-center justify-between text-xs font-bold text-[#6E4E12] group-hover:text-slate-900">
                  <span className="tracking-wider uppercase text-[11px]">
                    {getTranslation(language, 'services_view_detail')}
                  </span>
                  <FiChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-[#CFC3AC] max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FBF6E8] border border-[#C9B483] text-[#6E4E12] flex items-center justify-center mx-auto">
            <FiStar className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            {getTranslation(language, 'services_empty_title')}
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            {getTranslation(language, 'services_empty_desc')}
          </p>
        </div>
      )}
    </div>
  );
}
