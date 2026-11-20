import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiStar,
  FiAward,
} from 'react-icons/fi';
import {
  MdSpa,
  MdFitnessCenter,
  MdLocalBar,
  MdPool,
  MdRoomService,
  MdOutlineSportsTennis,
} from 'react-icons/md';

export default async function ServicesPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'services');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EBDDC3]">
        <Link
          href={`/${params.token}`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-[#866526] transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-3.5 py-1 rounded-full">
          Resort Amenities
        </span>
      </div>

      {/* Page Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#A38035]">
          <FiAward className="w-4 h-4" />
          <span>Tiện Ích & Dịch Vụ Đẳng Cấp</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight">
          Dịch Vụ & Trải Nghiệm Nghỉ Dưỡng
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Tận hưởng chuỗi tiện ích tiêu chuẩn 4 sao được chuẩn bị chu đáo để mang lại sự thư thái, tái tạo năng lượng cho Quý khách.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#B58E38]" />
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
        </div>
      </div>

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/${params.token}/services/${service.type}`}
              className="group relative bg-white rounded-2xl border border-[#EBDDC3] p-7 shadow-luxury hover:-translate-y-1 hover:border-[#B58E38] hover:shadow-[0_16px_32px_-6px_rgba(181,142,56,0.18)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center group-hover:bg-[#866526] group-hover:text-white transition-colors duration-300">
                    {getServiceIcon(service.type)}
                  </div>
                  <span className="text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-3 py-1 rounded-full uppercase tracking-wider">
                    {service.type}
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#866526] transition-colors mb-2">
                  {service.name}
                </h2>

                <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                  {service.description || 'Dịch vụ cao cấp phục vụ riêng cho khách lưu trú tại Hòa Bình Rạch Giá Resort.'}
                </p>

                {/* Info Pills */}
                <div className="space-y-2 mb-6">
                  {service.hours && (
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <FiClock className="w-3.5 h-3.5 text-[#866526] shrink-0" />
                      <span>{service.hours}</span>
                    </div>
                  )}
                  {service.location && (
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <FiMapPin className="w-3.5 h-3.5 text-[#866526] shrink-0" />
                      <span>{service.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#866526] group-hover:text-[#684B1B]">
                <span className="tracking-wider uppercase text-[11px]">Chi tiết dịch vụ</span>
                <FiChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-luxury p-12 text-center border border-[#EBDDC3] max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center mx-auto text-2xl">
            <FiStar className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Dịch Vụ Đang Cập Nhật
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            Danh mục dịch vụ đang được làm mới. Quý khách vui lòng liên hệ Bộ phận Lễ tân hoặc Bàn Concierge 24/7 để được hỗ trợ.
          </p>
        </div>
      )}
    </div>
  );
}
