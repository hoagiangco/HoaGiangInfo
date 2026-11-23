import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  FiPlus,
  FiBookOpen,
  FiEdit3,
  FiLayers,
  FiList,
  FiAlertTriangle,
} from 'react-icons/fi';
import { MdRestaurantMenu } from 'react-icons/md';
import {
  getAvailableLanguages,
  resolveMenuTranslations,
  type MenuTranslationFields,
} from '@/lib/translations';
import TranslationBadges from '@/components/TranslationBadges';
import AdminDeleteButton from '@/components/AdminDeleteButton';

export default async function MenuPage() {
  const [menus, allFlipbooks] = await Promise.all([
    prisma.menu.findMany({
      include: {
        items: true,
        flipbook: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.flipbook.findMany({
      select: { id: true, isActive: true, pages: true },
    }),
  ]);

  const flipbookStatusMap = new Map(
    allFlipbooks.map((fb) => [
      fb.id,
      { isActive: fb.isActive, hasPages: fb.pages.length > 0 },
    ])
  );

  const enrichedMenus = menus.map((menu) => {
    const resolved = resolveMenuTranslations(menu.description, menu.translations);
    const linkedEntries: Array<{ lang: 'VN' | 'EN' | '中文'; id: string }> = [];
    if (menu.flipbookId) linkedEntries.push({ lang: 'VN', id: menu.flipbookId });
    if (resolved.translations.en?.flipbookId) {
      linkedEntries.push({
        lang: 'EN',
        id: resolved.translations.en.flipbookId,
      });
    }
    if (resolved.translations.zh?.flipbookId) {
      linkedEntries.push({
        lang: '中文',
        id: resolved.translations.zh.flipbookId,
      });
    }

    const lockedLangs = linkedEntries
      .filter(({ id }) => {
        const st = flipbookStatusMap.get(id);
        return st ? !st.isActive : false;
      })
      .map(({ lang }) => lang);

    const hasActiveFlipbook = linkedEntries.some(({ id }) => {
      const st = flipbookStatusMap.get(id);
      return Boolean(st && st.isActive && st.hasPages);
    });
    const hasLinkedFlipbook =
      menu.fileType === 'flipbook' || linkedEntries.length > 0;
    const hasAnyFile = Boolean(
      menu.fileUrl ||
        resolved.translations.en?.fileUrl ||
        resolved.translations.zh?.fileUrl
    );
    const hiddenByLockedFlipbook = Boolean(
      menu.isActive &&
        hasLinkedFlipbook &&
        !hasActiveFlipbook &&
        menu.items.length === 0 &&
        !hasAnyFile
    );

    return {
      menu,
      resolved,
      linkedEntries,
      lockedLangs,
      hasActiveFlipbook,
      hiddenByLockedFlipbook,
    };
  });

  const totalMenus = menus.length;
  const totalItems = menus.reduce((acc, m) => acc + m.items.length, 0);
  const flipbookMenus = enrichedMenus.filter(
    (item) => item.linkedEntries.length > 0
  ).length;

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
      {enrichedMenus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedMenus.map(
            ({
              menu,
              resolved,
              linkedEntries,
              lockedLangs,
              hiddenByLockedFlipbook,
            }) => {
              const availableLangs = getAvailableLanguages<MenuTranslationFields>(
                resolved.translations,
                ['name', 'description', 'fileUrl', 'flipbookId']
              );
              return (
                <div
                  key={menu.id}
                  className={`bg-white rounded-2xl border shadow-card p-6 flex flex-col justify-between hover:shadow-luxury hover:border-[#B58E38] transition-all duration-300 ${
                    hiddenByLockedFlipbook
                      ? 'border-red-200/90'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
                        <MdRestaurantMenu className="w-5 h-5" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <TranslationBadges availableLangs={availableLangs} />
                        {linkedEntries.length > 0 && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              lockedLangs.length > 0
                                ? 'text-red-700 bg-red-50 border-red-200'
                                : 'text-amber-700 bg-amber-50 border-amber-200'
                            }`}
                          >
                            {lockedLangs.length === linkedEntries.length
                              ? 'Flipbook tạm khóa'
                              : lockedLangs.length > 0
                              ? `Flipbook (${lockedLangs.join('/')} khóa)`
                              : 'Flipbook'}
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
                    {(resolved.translations.en?.name ||
                      resolved.translations.zh?.name) && (
                      <p className="text-xs font-medium text-[#A38035] mb-2">
                        {[
                          resolved.translations.en?.name,
                          resolved.translations.zh?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}

                    <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                      {resolved.descriptionVi ||
                        resolved.translations.en?.description ||
                        resolved.translations.zh?.description ||
                        'Chưa có mô tả cho thực đơn này.'}
                    </p>

                    {hiddenByLockedFlipbook ? (
                      <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-4">
                        <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Đang tự ẩn phía khách vì tất cả Flipbook gắn vào đều bị
                          tạm khóa.
                        </span>
                      </div>
                    ) : (
                      menu.isActive &&
                      lockedLangs.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
                          <FiAlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Flipbook bản {lockedLangs.join(', ')} đang tạm khóa
                            (không hiển thị cho khách).
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        !menu.isActive
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : hiddenByLockedFlipbook
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          !menu.isActive
                            ? 'bg-slate-400'
                            : hiddenByLockedFlipbook
                            ? 'bg-red-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {!menu.isActive
                        ? 'Tạm ẩn'
                        : hiddenByLockedFlipbook
                        ? 'Tự ẩn (Flipbook khóa)'
                        : 'Đang hoạt động'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/menu/${menu.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3.5 py-2 rounded-xl transition-all"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                      </Link>
                      <AdminDeleteButton
                        endpoint={`/api/menu/${menu.id}`}
                        itemName={menu.name}
                        entityLabel="thực đơn"
                        variant="card"
                        warningNote={
                          menu.items.length > 0
                            ? `Tất cả ${menu.items.length} món ăn thuộc thực đơn này cũng sẽ bị xóa vĩnh viễn.`
                            : undefined
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            }
          )}
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
