import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiInfo, FiEdit3, FiCheckCircle } from 'react-icons/fi';
import {
  getAvailableLanguages,
  parseTranslations,
  type InformationTranslationFields,
} from '@/lib/translations';
import { hasHtmlTable, stripHtmlToText } from '@/lib/sanitize';
import TranslationBadges from '@/components/TranslationBadges';
import AdminDeleteButton from '@/components/AdminDeleteButton';

export default async function InformationPage() {
  const [information, allFlipbooks] = await Promise.all([
    prisma.information.findMany({
      include: {
        flipbook: { select: { id: true, isActive: true, pages: true } },
      },
      orderBy: { order: 'asc' },
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

  const totalCount = information.length;
  const activeCount = information.filter((i) => i.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            CẨM NANG LƯU TRÚ
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Thông Tin Cần Biết
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Biên tập thông tin WiFi, chính sách nhận/trả phòng, quy định an toàn và hỗ trợ khách hàng
          </p>
        </div>

        <Link
          href="/admin/information/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Thông Tin Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiInfo className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số mục thông tin</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang hiển thị cho khách</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Danh Sách Mục Hướng Dẫn
          </h2>
          <span className="text-xs text-slate-500">
            {information.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Thứ Tự</th>
                <th className="px-6 py-4">Chuyên Mục</th>
                <th className="px-6 py-4">Tiêu Đề</th>
                <th className="px-6 py-4">Định Dạng</th>
                <th className="px-6 py-4">Ngôn Ngữ</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {information.map((info) => {
                const parsed = parseTranslations<InformationTranslationFields>(
                  info.translations
                );
                const linkedEntries: Array<{
                  lang: 'VN' | 'EN' | '中文';
                  id: string;
                }> = [];
                if (info.flipbookId) {
                  linkedEntries.push({ lang: 'VN', id: info.flipbookId });
                }
                if (parsed.en?.flipbookId) {
                  linkedEntries.push({ lang: 'EN', id: parsed.en.flipbookId });
                }
                if (parsed.zh?.flipbookId) {
                  linkedEntries.push({ lang: '中文', id: parsed.zh.flipbookId });
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
                const hasFlipbook = linkedEntries.length > 0;
                const hasFile = Boolean(
                  info.fileUrl || parsed.en?.fileUrl || parsed.zh?.fileUrl
                );
                const hasTextContent = Boolean(
                  stripHtmlToText(info.content) ||
                    stripHtmlToText(parsed.en?.content || '') ||
                    stripHtmlToText(parsed.zh?.content || '')
                );
                const hiddenByLockedFlipbook = Boolean(
                  info.isActive &&
                    (info.fileType === 'flipbook' || hasFlipbook) &&
                    !hasActiveFlipbook &&
                    !hasTextContent &&
                    !hasFile
                );
                const formatBadge = hasFlipbook
                  ? lockedLangs.length === linkedEntries.length
                    ? 'Flipbook (khóa)'
                    : lockedLangs.length > 0
                    ? `Flipbook (${lockedLangs.join('/')} khóa)`
                    : 'Flipbook'
                  : hasFile
                  ? info.fileType === 'pdf'
                    ? 'PDF'
                    : 'Hình ảnh'
                  : hasHtmlTable(info.content)
                  ? 'Bảng tra cứu'
                  : 'Văn bản';

                return (
                <tr key={info.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                    #{info.order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-[#866526]">
                    <span className="bg-[#FAF7EE] border border-[#E6D3A7]/60 px-2.5 py-1 rounded-md">
                      {info.category || 'Chung'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-serif font-bold text-slate-900">
                    {info.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        lockedLangs.length > 0
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {formatBadge}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TranslationBadges
                      availableLangs={getAvailableLanguages<InformationTranslationFields>(
                        info.translations,
                        ['title', 'content', 'fileUrl', 'flipbookId']
                      )}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        !info.isActive
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : hiddenByLockedFlipbook
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          !info.isActive
                            ? 'bg-slate-400'
                            : hiddenByLockedFlipbook
                            ? 'bg-red-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      {!info.isActive
                        ? 'Ẩn'
                        : hiddenByLockedFlipbook
                        ? 'Tự ẩn (Flipbook khóa)'
                        : 'Hiển thị'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/information/${info.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3 py-1.5 rounded-lg transition-all"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </Link>
                      <AdminDeleteButton
                        endpoint={`/api/information/${info.id}`}
                        itemName={info.title}
                        entityLabel="mục thông tin"
                        variant="table"
                      />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
