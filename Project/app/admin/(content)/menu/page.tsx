import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiBookOpen, FiEdit3, FiLayers, FiList, FiGlobe } from 'react-icons/fi';
import { MdRestaurantMenu } from 'react-icons/md';
import { parseMenuBilingual } from '@/lib/bilingual-menu';

export default async function MenuPage() {
  const menus = await prisma.menu.findMany({
    include: {
      items: true,
      flipbook: true,
    },
    orderBy: { name: 'asc' },
  });

  const totalMenus = menus.length;
  const totalItems = menus.reduce((acc, m) => acc + m.items.length, 0);
  const flipbookMenus = menus.filter((m) => m.flipbookId).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            ẨM THỰC RESORT & SPA
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Thực Đơn & Bar
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Thiết lập danh mục thực đơn món ăn, đồ uống, file PDF và Flipbook trực tuyến
          </p>
        </div>

        <Link
          href="/admin/menu/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Thực Đơn Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <MdRestaurantMenu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số menu</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalMenus}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số món ăn</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{totalItems}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl shrink-0">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Liên kết Flipbook</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{flipbookMenus}</p>
          </div>
        </div>
      </div>

      {/* Menu Cards Grid */}
      {menus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu) => {
            const bilingual = parseMenuBilingual(menu.description);
            return (
              <div
                key={menu.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between hover:shadow-luxury hover:border-[#B58E38] transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center">
                      <MdRestaurantMenu className="w-5 h-5" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {bilingual.hasEnglishVersion && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <FiGlobe className="w-3 h-3" />
                          Song ngữ VI/EN
                        </span>
                      )}
                      {menu.flipbook && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Flipbook
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {menu.items.length} món
                      </span>
                    </div>
                  </div>

                  <h2 className="font-serif text-xl font-bold text-slate-900 mb-1">
                    {menu.name}
                  </h2>
                  {bilingual.nameEn && (
                    <p className="text-xs font-medium text-[#A38035] mb-2">
                      {bilingual.nameEn}
                    </p>
                  )}

                  <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-6">
                    {bilingual.descriptionVi ||
                      bilingual.descriptionEn ||
                      'Chưa có mô tả cho thực đơn này.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {menu.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
                  </span>
                  <Link
                    href={`/admin/menu/${menu.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3.5 py-2 rounded-xl transition-all"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center mx-auto text-xl">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-slate-900">
            Chưa có thực đơn nào
          </h3>
          <p className="text-slate-500 text-xs">
            Bấm nút &ldquo;Tạo Thực Đơn Mới&rdquo; ở phía trên để bắt đầu thêm menu cho nhà hàng và bar.
          </p>
        </div>
      )}
    </div>
  );
}
