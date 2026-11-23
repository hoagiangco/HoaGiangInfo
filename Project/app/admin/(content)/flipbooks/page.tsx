import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  FiPlus,
  FiBookOpen,
  FiEdit3,
  FiLayers,
  FiCheckCircle,
  FiLink,
} from 'react-icons/fi';
import {
  parseTranslations,
  resolveMenuTranslations,
  type InformationTranslationFields,
} from '@/lib/translations';
import AdminDeleteButton from '@/components/AdminDeleteButton';

interface FlipbookUsage {
  kind: 'menu' | 'information';
  entityId: string;
  label: string;
  lang: 'VN' | 'EN' | '中文';
  href: string;
  parentActive: boolean;
}

export default async function FlipbooksPage() {
  const [flipbooks, menus, informationItems] = await Promise.all([
    prisma.flipbook.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.menu.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        flipbookId: true,
        translations: true,
        isActive: true,
      },
    }),
    prisma.information.findMany({
      select: {
        id: true,
        title: true,
        flipbookId: true,
        translations: true,
        isActive: true,
      },
    }),
  ]);

  const usageByFlipbookId = new Map<string, FlipbookUsage[]>();
  const addUsage = (
    flipbookId: string | null | undefined,
    usage: FlipbookUsage
  ) => {
    if (!flipbookId) return;
    const list = usageByFlipbookId.get(flipbookId) || [];
    list.push(usage);
    usageByFlipbookId.set(flipbookId, list);
  };

  for (const menu of menus) {
    const resolved = resolveMenuTranslations(menu.description, menu.translations);
    addUsage(menu.flipbookId, {
      kind: 'menu',
      entityId: menu.id,
      label: menu.name,
      lang: 'VN',
      href: `/admin/menu/${menu.id}`,
      parentActive: menu.isActive,
    });
    addUsage(resolved.translations.en?.flipbookId, {
      kind: 'menu',
      entityId: menu.id,
      label: menu.name,
      lang: 'EN',
      href: `/admin/menu/${menu.id}`,
      parentActive: menu.isActive,
    });
    addUsage(resolved.translations.zh?.flipbookId, {
      kind: 'menu',
      entityId: menu.id,
      label: menu.name,
      lang: '中文',
      href: `/admin/menu/${menu.id}`,
      parentActive: menu.isActive,
    });
  }

  for (const info of informationItems) {
    const parsed = parseTranslations<InformationTranslationFields>(
      info.translations
    );
    addUsage(info.flipbookId, {
      kind: 'information',
      entityId: info.id,
      label: info.title,
      lang: 'VN',
      href: `/admin/information/${info.id}`,
      parentActive: info.isActive,
    });
    addUsage(parsed.en?.flipbookId, {
      kind: 'information',
      entityId: info.id,
      label: info.title,
      lang: 'EN',
      href: `/admin/information/${info.id}`,
      parentActive: info.isActive,
    });
    addUsage(parsed.zh?.flipbookId, {
      kind: 'information',
      entityId: info.id,
      label: info.title,
      lang: '中文',
      href: `/admin/information/${info.id}`,
      parentActive: info.isActive,
    });
  }

  const totalCount = flipbooks.length;
  const activeCount = flipbooks.filter((f) => f.isActive).length;
  const linkedCount = flipbooks.filter(
    (f) => (usageByFlipbookId.get(f.id)?.length || 0) > 0
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            KHO TÀI LIỆU SỐ HÓA
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Flipbooks Trực Tuyến
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Kho sách lật trang dùng làm nguồn gắn theo từng ngôn ngữ (VN / EN / 中文) trong Thực đơn và Thông tin cần biết
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center text-xl shrink-0">
            <FiLink className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang được gắn dùng</p>
            <p className="text-2xl font-bold text-amber-700 mt-0.5">{linkedCount}</p>
          </div>
        </div>
      </div>

      {/* Flipbooks Grid */}
      {flipbooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flipbooks.map((flipbook) => {
            const usages = usageByFlipbookId.get(flipbook.id) || [];
            const linkedMenuCount = new Set(
              usages.filter((u) => u.kind === 'menu').map((u) => u.entityId)
            ).size;
            const linkedInfoCount = new Set(
              usages
                .filter((u) => u.kind === 'information')
                .map((u) => u.entityId)
            ).size;

            const warningParts: string[] = [];
            if (linkedMenuCount > 0) {
              warningParts.push(`${linkedMenuCount} thực đơn`);
            }
            if (linkedInfoCount > 0) {
              warningParts.push(`${linkedInfoCount} mục thông tin`);
            }
            const warningNote =
              warningParts.length > 0
                ? `Flipbook này đang được gắn trong ${warningParts.join(
                    ' và '
                  )}. Nếu xóa, các liên kết này sẽ tự động được gỡ bỏ.`
                : undefined;

            return (
              <div
                key={flipbook.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between hover:shadow-luxury hover:border-[#B58E38] transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center">
                      <FiLayers className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7]/60 px-2.5 py-0.5 rounded-full">
                      {flipbook.pages.length} trang
                    </span>
                  </div>

                  <h2 className="font-serif text-xl font-bold text-slate-900 mb-2">
                    {flipbook.name}
                  </h2>

                  <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                    {flipbook.description || 'Chưa có ghi chú nội bộ.'}
                  </p>

                  {usages.length > 0 ? (
                    <div
                      className={`rounded-xl p-3 mb-4 space-y-1.5 border ${
                        flipbook.isActive
                          ? 'bg-amber-50/70 border-amber-200/70'
                          : 'bg-red-50/60 border-red-200/70'
                      }`}
                    >
                      <p
                        className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                          flipbook.isActive ? 'text-amber-800' : 'text-red-700'
                        }`}
                      >
                        <FiLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Đang gắn tại ({usages.length}):</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {usages.map((u, idx) => (
                          <Link
                            key={`${u.kind}-${u.entityId}-${u.lang}-${idx}`}
                            href={u.href}
                            className={`inline-flex items-center gap-1 text-[11px] bg-white hover:bg-[#FAF7EE] border rounded-lg px-2 py-0.5 transition-colors max-w-full ${
                              u.parentActive
                                ? 'text-slate-700 border-amber-200/80'
                                : 'text-slate-400 border-slate-200'
                            }`}
                            title={`${u.kind === 'menu' ? 'Thực đơn' : 'Thông tin'}: ${u.label} (${u.lang})${u.parentActive ? '' : ' — đang tạm ẩn'}`}
                          >
                            <span className="font-bold text-[#866526] shrink-0">
                              {u.lang}
                            </span>
                            <span className="text-slate-400 shrink-0">·</span>
                            <span className="truncate">
                              {u.kind === 'menu' ? 'Menu' : 'Info'}: {u.label}
                            </span>
                            {!u.parentActive && (
                              <span className="text-[10px] text-slate-400 shrink-0">
                                (ẩn)
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                      {!flipbook.isActive && (
                        <p className="text-[11px] text-red-700 pt-0.5">
                          Đang tạm khóa — nội dung này hiện bị ẩn khỏi trang
                          khách.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-lg mb-4">
                      Chưa gắn vào thực đơn hay thông tin nào
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      flipbook.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        flipbook.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    {flipbook.isActive ? 'Hoạt động' : 'Tạm khóa'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/flipbooks/${flipbook.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3.5 py-2 rounded-xl transition-all"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </Link>
                    <AdminDeleteButton
                      endpoint={`/api/flipbook/${flipbook.id}`}
                      itemName={flipbook.name}
                      entityLabel="flipbook"
                      variant="card"
                      warningNote={warningNote}
                    />
                  </div>
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
