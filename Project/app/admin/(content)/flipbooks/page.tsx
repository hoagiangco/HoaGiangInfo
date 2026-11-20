import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiBookOpen, FiEdit3, FiLayers, FiCheckCircle } from 'react-icons/fi';

export default async function FlipbooksPage() {
  const flipbooks = await prisma.flipbook.findMany({
    include: {
      menus: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = flipbooks.length;
  const activeCount = flipbooks.filter((f) => f.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            TÀI LIỆU SỐ HÓA
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Flipbooks Trực Tuyến
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Số hóa menu, brochure và tài liệu giới thiệu thành dạng sách lật trang tương tác cao cấp
          </p>
        </div>

        <Link
          href="/admin/flipbooks/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Flipbook Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số Flipbooks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang hoạt động</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Flipbooks Grid */}
      {flipbooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flipbooks.map((flipbook) => (
            <div
              key={flipbook.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between hover:shadow-luxury hover:border-[#B58E38] transition-all duration-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center">
                    <FiLayers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-2.5 py-0.5 rounded-full">
                    {flipbook.pages.length} trang
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-slate-900 mb-2">
                  {flipbook.name}
                </h2>

                <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                  {flipbook.description || 'Chưa có mô tả cho flipbook này.'}
                </p>

                {flipbook.menus.length > 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-lg mb-4">
                    Đang liên kết với {flipbook.menus.length} thực đơn
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    flipbook.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${flipbook.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {flipbook.isActive ? 'Hoạt động' : 'Tạm khóa'}
                </span>

                <Link
                  href={`/admin/flipbooks/${flipbook.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3.5 py-2 rounded-xl transition-all"
                >
                  <FiEdit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center mx-auto text-xl">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            Chưa có flipbook nào
          </h3>
          <p className="text-slate-500 text-xs">
            Bấm nút &ldquo;Tạo Flipbook Mới&rdquo; để tải lên các trang sách hoặc tài liệu giới thiệu điện tử.
          </p>
        </div>
      )}
    </div>
  );
}
