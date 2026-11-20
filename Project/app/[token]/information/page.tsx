import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiInfo,
  FiAward,
  FiPhoneCall,
  FiWifi,
  FiShield,
  FiHelpCircle,
} from 'react-icons/fi';
import { sanitizeRichText } from '@/lib/sanitize';

export default async function InformationPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'information');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const information = await prisma.information.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  function getInfoIcon(title: string, category: string) {
    const text = `${title} ${category}`.toLowerCase();
    if (text.includes('wifi') || text.includes('internet') || text.includes('mạng')) {
      return <FiWifi className="w-5 h-5" />;
    }
    if (text.includes('an ninh') || text.includes('safety') || text.includes('quy định')) {
      return <FiShield className="w-5 h-5" />;
    }
    if (text.includes('liên hệ') || text.includes('hotline') || text.includes('phone') || text.includes('điện thoại')) {
      return <FiPhoneCall className="w-5 h-5" />;
    }
    if (text.includes('hướng dẫn') || text.includes('faq')) {
      return <FiHelpCircle className="w-5 h-5" />;
    }
    return <FiInfo className="w-5 h-5" />;
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
          Guest Information
        </span>
      </div>

      {/* Page Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#A38035]">
          <FiAward className="w-4 h-4" />
          <span>Cẩm Nang Lưu Trú Tiện Ích</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight">
          Thông Tin Cần Biết
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Tất cả thông tin thiết yếu về mạng không dây, quy định lưu trú, số máy nội bộ và các lưu ý hữu ích dành cho kỳ nghỉ của Quý khách.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#B58E38]" />
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
        </div>
      </div>

      {/* Information Cards Grid */}
      {information.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {information.map((info) => (
            <div
              key={info.id}
              className="bg-white rounded-2xl border border-[#EBDDC3] p-7 shadow-luxury hover:border-[#B58E38] hover:shadow-[0_16px_32px_-6px_rgba(181,142,56,0.15)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center">
                    {getInfoIcon(info.title, info.category || '')}
                  </div>
                  {info.category && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-3 py-0.5 rounded-full">
                      {info.category}
                    </span>
                  )}
                </div>

                <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">
                  {info.title}
                </h2>

                <div
                  className="prose prose-sm prose-stone max-w-none text-stone-600 leading-relaxed text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(info.content) }}
                />
              </div>

              <div className="pt-4 mt-6 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                <span>Hỗ trợ 24/7</span>
                <span className="italic">Hoa Binh Rach Gia Guest Care</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-luxury p-12 text-center border border-[#EBDDC3] max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center mx-auto text-2xl">
            <FiInfo className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Thông Tin Đang Cập Nhật
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            Hệ thống thông tin đang được cập nhật. Nếu Quý khách cần hỗ trợ ngay, vui lòng liên hệ quầy Lễ tân hoặc quay số 0.
          </p>
        </div>
      )}
    </div>
  );
}
