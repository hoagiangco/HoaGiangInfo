import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiPhoneCall,
  FiAward,
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

export default async function ServiceDetailPage({
  params,
}: {
  params: { token: string; service: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'services');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const service = await prisma.service.findFirst({
    where: {
      type: params.service,
      isActive: true,
    },
  });

  if (!service) {
    notFound();
  }

  function getServiceIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes('spa') || t.includes('massage')) {
      return <MdSpa className="w-8 h-8" />;
    }
    if (t.includes('gym') || t.includes('fitness')) {
      return <MdFitnessCenter className="w-8 h-8" />;
    }
    if (t.includes('bar') || t.includes('lounge') || t.includes('coffee')) {
      return <MdLocalBar className="w-8 h-8" />;
    }
    if (t.includes('pool') || t.includes('boi') || t.includes('bơi')) {
      return <MdPool className="w-8 h-8" />;
    }
    if (t.includes('tennis') || t.includes('sport')) {
      return <MdOutlineSportsTennis className="w-8 h-8" />;
    }
    if (t.includes('concierge') || t.includes('room-service')) {
      return <MdRoomService className="w-8 h-8" />;
    }
    return <FiStar className="w-8 h-8" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EBDDC3]">
        <Link
          href={`/${params.token}/services`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-[#866526] transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Danh sách dịch vụ</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-3.5 py-1 rounded-full">
          4-Star Service
        </span>
      </div>

      {/* Service Hero Header */}
      <div className="bg-white rounded-3xl border border-[#EBDDC3] p-8 sm:p-10 shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0 shadow-sm">
              {getServiceIcon(service.type)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] tracking-wider uppercase mb-1">
                <FiAward className="w-3.5 h-3.5" />
                <span>Dịch Vụ Tiêu Chuẩn 4 Sao</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
                {service.name}
              </h1>
            </div>
          </div>

          <span className="self-start sm:self-auto text-xs font-bold uppercase tracking-wider text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-4 py-1.5 rounded-full">
            {service.type}
          </span>
        </div>

        {/* Info Badges */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-stone-100">
          {service.hours && (
            <div className="inline-flex items-center gap-2 bg-[#FAF7EE] border border-[#E6D3A7]/60 px-4 py-2 rounded-xl text-xs text-stone-700">
              <FiClock className="w-4 h-4 text-[#866526]" />
              <span className="font-semibold text-stone-900">Giờ hoạt động:</span>
              <span>{service.hours}</span>
            </div>
          )}

          {service.location && (
            <div className="inline-flex items-center gap-2 bg-[#FAF7EE] border border-[#E6D3A7]/60 px-4 py-2 rounded-xl text-xs text-stone-700">
              <FiMapPin className="w-4 h-4 text-[#866526]" />
              <span className="font-semibold text-stone-900">Vị trí:</span>
              <span>{service.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="pt-2 text-stone-700 text-sm sm:text-base leading-relaxed space-y-4">
          <p>{service.description}</p>
        </div>
      </div>

      {/* Image Gallery */}
      {service.images && service.images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#B58E38]" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
              Không Gian & Hình Ảnh Thực Tế
            </h2>
            <div className="flex-1 h-[1px] bg-[#EBDDC3] ml-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.images.map((image, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-2xl overflow-hidden border border-[#EBDDC3] shadow-card bg-stone-100 group"
              >
                <img
                  src={image}
                  alt={`${service.name} ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 24/7 Concierge Booking Callout */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#0B1120] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-luxury">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#E6D3A7]">
            Đặt Chỗ & Trải Nghiệm Dịch Vụ
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Để đảm bảo không gian và thời gian phục vụ hoàn hảo nhất, Quý khách vui lòng liên hệ trước với bộ phận Lễ tân hoặc Bàn Concierge.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#A38035] to-[#866526] px-5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md shadow-[#866526]/30 shrink-0">
          <FiPhoneCall className="w-4 h-4" />
          <span>Bấm phím 0 từ phòng nghỉ</span>
        </div>
      </div>
    </div>
  );
}
