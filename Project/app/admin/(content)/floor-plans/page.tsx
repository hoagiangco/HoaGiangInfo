import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiMap, FiEdit3, FiLayers } from 'react-icons/fi';
import { MdApartment } from 'react-icons/md';

export default async function FloorPlansPage() {
  const floorPlans = await prisma.floorPlan.findMany({
    include: {
      rooms: true,
    },
    orderBy: { name: 'asc' },
  });

  const totalPlans = floorPlans.length;
  const totalRooms = floorPlans.reduce((acc, p) => acc + p.rooms.length, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            MẶT BẰNG KHU NGHỈ DƯỠNG
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Sơ Đồ Phòng Nghỉ
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Tải lên sơ đồ các tầng, biệt thự và định vị các phòng để khách tra cứu tương tác
          </p>
        </div>

        <Link
          href="/admin/floor-plans/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Sơ Đồ Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <MdApartment className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số bản vẽ sơ đồ</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalPlans}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số phòng định vị</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalRooms}</p>
          </div>
        </div>
      </div>

      {/* Floor Plans Grid */}
      {floorPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {floorPlans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between hover:shadow-luxury hover:border-[#B58E38] transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center">
                    <MdApartment className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-3 py-1 rounded-full">
                    {plan.rooms.length} phòng
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-slate-900 mb-2">
                  {plan.name}
                </h2>

                <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                  {plan.description || 'Chưa có mô tả cho sơ đồ này.'}
                </p>

                {plan.imageUrl && (
                  <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 mb-4">
                    <img
                      src={plan.imageUrl}
                      alt={plan.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {plan.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                </span>
                <Link
                  href={`/admin/floor-plans/${plan.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3.5 py-2 rounded-xl transition-all"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa sơ đồ</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center mx-auto text-xl">
            <FiMap className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            Chưa có sơ đồ nào
          </h3>
          <p className="text-slate-500 text-xs">
            Bấm nút &ldquo;Tạo Sơ Đồ Mới&rdquo; để tải lên hình ảnh bản vẽ các tầng và biệt thự.
          </p>
        </div>
      )}
    </div>
  );
}
