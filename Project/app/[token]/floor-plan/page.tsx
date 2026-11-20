import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiChevronRight,
  FiMap,
  FiAward,
  FiLayers,
} from 'react-icons/fi';
import { MdApartment } from 'react-icons/md';

export default async function FloorPlanPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'floor-plan');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const floorPlans = await prisma.floorPlan.findMany({
    where: { isActive: true },
    include: {
      rooms: {
        orderBy: { number: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

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
          Resort Map & Layout
        </span>
      </div>

      {/* Page Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#A38035]">
          <FiAward className="w-4 h-4" />
          <span>Sơ Đồ Không Gian Nghỉ Dưỡng</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight">
          Sơ Đồ Phòng & Khu Nghỉ Dưỡng
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Xem chi tiết mặt bằng các tầng, biệt thự nghỉ dưỡng và vị trí phòng để dễ dàng định vị không gian và lối đi trong khuôn viên resort.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#B58E38]" />
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
        </div>
      </div>

      {/* Floor Plans Grid */}
      {floorPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {floorPlans.map((floorPlan) => (
            <Link
              key={floorPlan.id}
              href={`/${params.token}/floor-plan/${floorPlan.id}`}
              className="group relative bg-white rounded-2xl border border-[#EBDDC3] p-7 shadow-luxury hover:-translate-y-1 hover:border-[#B58E38] hover:shadow-[0_16px_32px_-6px_rgba(181,142,56,0.18)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center group-hover:bg-[#866526] group-hover:text-white transition-colors duration-300">
                    <MdApartment className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-3 py-1 rounded-full">
                    {floorPlan.rooms.length} phòng
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#866526] transition-colors mb-2">
                  {floorPlan.name}
                </h2>

                <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                  {floorPlan.description || 'Sơ đồ mặt bằng chi tiết các phòng và lối thoát hiểm.'}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#866526] group-hover:text-[#684B1B]">
                <span className="tracking-wider uppercase text-[11px]">Xem sơ đồ tương tác</span>
                <FiChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-luxury p-12 text-center border border-[#EBDDC3] max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center mx-auto text-2xl">
            <FiMap className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Sơ Đồ Đang Cập Nhật
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            Sơ đồ mặt bằng đang được số hóa hoàn thiện. Quý khách vui lòng liên hệ nhân viên lễ tân để nhận bản đồ chỉ dẫn giấy.
          </p>
        </div>
      )}
    </div>
  );
}
