import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FiBookOpen, FiArrowLeft, FiChevronRight, FiAward, FiLayers, FiGlobe } from 'react-icons/fi';
import { MdRestaurantMenu } from 'react-icons/md';
import { parseMenuBilingual } from '@/lib/bilingual-menu';

export default async function MenuPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'menu');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const menus = await prisma.menu.findMany({
    where: {
      isActive: true,
    },
    include: {
      items: {
        where: { isAvailable: true },
      },
      flipbook: true,
    },
    orderBy: {
      name: 'asc',
    },
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
          Culinary & Dining
        </span>
      </div>

      {/* Page Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.25em] uppercase text-[#A38035]">
          <FiAward className="w-4 h-4" />
          <span>Tinh Hoa Ẩm Thực Nghỉ Dưỡng</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight">
          Thực Đơn Nhà Hàng & Bar
        </h1>
        <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Thưởng thức phong vị ẩm thực thượng hạng, kết hợp tinh tế giữa nguyên liệu địa phương tươi sống và nghệ thuật chế biến chuẩn 4 sao quốc tế.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#B58E38]" />
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
        </div>
      </div>

      {/* Menus Grid */}
      {menus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {menus.map((menu) => {
            const bilingual = parseMenuBilingual(menu.description);
            return (
              <Link
                key={menu.id}
                href={`/${params.token}/menu/${menu.id}`}
                className="group relative bg-white rounded-2xl border border-[#EBDDC3] p-7 shadow-luxury hover:-translate-y-1 hover:border-[#B58E38] hover:shadow-[0_16px_32px_-6px_rgba(181,142,56,0.18)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center text-xl group-hover:bg-[#866526] group-hover:text-white transition-colors duration-300">
                      <MdRestaurantMenu className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {bilingual.hasEnglishVersion && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <FiGlobe className="w-3 h-3" />
                          VI / EN
                        </span>
                      )}
                      {menu.flipbook ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-2.5 py-0.5 rounded-full">
                          <FiLayers className="w-3 h-3" />
                          Flipbook
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded-full">
                          {menu.items.length} món
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="font-serif text-xl font-bold text-stone-900 group-hover:text-[#866526] transition-colors mb-1">
                    {menu.name}
                  </h2>
                  {bilingual.nameEn && (
                    <p className="text-xs font-medium text-[#A38035] mb-2">
                      {bilingual.nameEn}
                    </p>
                  )}

                  <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6">
                    {bilingual.descriptionVi ||
                      bilingual.descriptionEn ||
                      'Khám phá danh sách các món ăn chọn lọc và thức uống đặc sắc của nhà hàng.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-[#866526] group-hover:text-[#684B1B]">
                  <span className="tracking-wider uppercase text-[11px]">Xem thực đơn chi tiết</span>
                  <FiChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-luxury p-12 text-center border border-[#EBDDC3] max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center mx-auto text-2xl">
            <FiBookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Thực Đơn Đang Cập Nhật
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            Hệ thống đang chuẩn bị danh mục món mới cho ngày hôm nay. Quý khách vui lòng liên hệ nhân viên phục vụ để được giới thiệu trực tiếp.
          </p>
        </div>
      )}
    </div>
  );
}
