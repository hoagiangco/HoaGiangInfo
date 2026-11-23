'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiPhoneCall,
  FiAward,
  FiStar,
  FiX,
  FiMaximize2,
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
import type { ServiceViewItem } from './ServicesListView';

interface ServiceDetailViewProps {
  token: string;
  service: ServiceViewItem;
}

function getServiceIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes('spa') || t.includes('massage')) {
    return <MdSpa className="w-7 h-7" />;
  }
  if (t.includes('gym') || t.includes('fitness')) {
    return <MdFitnessCenter className="w-7 h-7" />;
  }
  if (t.includes('bar') || t.includes('lounge') || t.includes('coffee')) {
    return <MdLocalBar className="w-7 h-7" />;
  }
  if (t.includes('pool') || t.includes('boi') || t.includes('bơi')) {
    return <MdPool className="w-7 h-7" />;
  }
  if (t.includes('tennis') || t.includes('sport')) {
    return <MdOutlineSportsTennis className="w-7 h-7" />;
  }
  if (t.includes('concierge') || t.includes('room-service')) {
    return <MdRoomService className="w-7 h-7" />;
  }
  return <FiStar className="w-7 h-7" />;
}

export default function ServiceDetailView({
  token,
  service,
}: ServiceDetailViewProps) {
  const { language } = useLanguage();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
  const typeLabel = translateCategory(language, 'service_type_', service.type);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* Compact Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#D5C9B2]">
        <Link
          href={`/${token}/services`}
          className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white border border-[#CFC3AC] text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] shadow-sm transition-colors active:scale-95"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>{getTranslation(language, 'services_back_list')}</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-3 py-1 rounded-full truncate max-w-[180px]">
          {typeLabel}
        </span>
      </div>

      {/* High-Contrast Service Overview Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#CFC3AC] p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex items-start gap-3.5 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0F172A] border border-[#C5A456]/50 text-[#E8CA7A] flex items-center justify-center shrink-0 shadow-sm">
            {getServiceIcon(service.type)}
          </div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6E4E12] tracking-wider uppercase mb-1">
              <FiAward className="w-3.5 h-3.5" />
              <span>{getTranslation(language, 'service_standard_4star')}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {localizedName}
            </h1>
          </div>
        </div>

        {/* Scannable 2-Column Key Info Grid (Hours & Location) */}
        {(localizedHours || localizedLocation) && (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 sm:gap-4 pt-3 border-t border-slate-200">
            {localizedHours && (
              <div className="flex items-start gap-2.5 bg-[#FBF6E8] border border-[#C9B483] px-3.5 py-3 rounded-xl">
                <span className="w-8 h-8 rounded-lg bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0 mt-0.5">
                  <FiClock className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E4E12]">
                    {getTranslation(language, 'hours')}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {localizedHours}
                  </p>
                </div>
              </div>
            )}

            {localizedLocation && (
              <div className="flex items-start gap-2.5 bg-[#FBF6E8] border border-[#C9B483] px-3.5 py-3 rounded-xl">
                <span className="w-8 h-8 rounded-lg bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0 mt-0.5">
                  <FiMapPin className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#6E4E12]">
                    {getTranslation(language, 'location')}
                  </p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {localizedLocation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* High-Contrast Description */}
        <div className="pt-1 text-slate-800 text-[15px] sm:text-base leading-relaxed">
          <p className="whitespace-pre-line">{localizedDesc}</p>
        </div>
      </div>

      {/* Image Gallery with Tap-to-Zoom Lightbox */}
      {service.images && service.images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rotate-45 bg-[#6E4E12]" />
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-slate-900">
                {getTranslation(language, 'service_gallery_title')}
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              {getTranslation(language, 'tap_to_enlarge')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
            {service.images.map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setLightboxImage(image)}
                className="relative aspect-video rounded-2xl overflow-hidden border border-[#CFC3AC] shadow-sm bg-slate-100 group text-left active:scale-[0.99] transition-transform"
              >
                <img
                  src={image}
                  alt={`${localizedName} ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-sm">
                  <FiMaximize2 className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* High-Contrast 24/7 Concierge Booking Callout */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#C5A456]/40 shadow-md">
        <div className="space-y-1">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#E8CA7A]">
            {getTranslation(language, 'service_booking_title')}
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
            {getTranslation(language, 'service_booking_desc')}
          </p>
        </div>
        <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#E8CA7A] text-[#0F172A] px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase shrink-0 shadow-sm">
          <FiPhoneCall className="w-4 h-4" />
          <span>{getTranslation(language, 'service_booking_cta')}</span>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label={getTranslation(language, 'close')}
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt={localizedName}
            className="max-w-full max-h-[85vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
