import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import { hasPermission, canEditDocument } from '@/lib/auth/permissions';
import { DOC_CATEGORIES, VISIBILITY_LABELS, documentVisibilityWhere } from '@/lib/documents';
import { FiPlus, FiFileText, FiSearch, FiFilter, FiLock, FiUsers, FiEdit3 } from 'react-icons/fi';
import AdminDeleteButton from '@/components/AdminDeleteButton';

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const user = await requirePermission('documents.read');
  const canWrite = hasPermission(user, 'documents.write');

  const q = (searchParams.q ?? '').trim().slice(0, 100);
  const category = searchParams.category && searchParams.category in DOC_CATEGORIES ? searchParams.category : undefined;

  const documents = await prisma.technicalDocument.findMany({
    where: {
      AND: [
        documentVisibilityWhere(user),
        canWrite ? {} : { isActive: true },
        category ? { category } : {},
        q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  });

  const grouped: Record<string, typeof documents> = {};
  for (const d of documents) (grouped[d.category] ??= []).push(d);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            KHO TÀI LIỆU RIÊNG TƯ & BẢO MẬT
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Tài Liệu & Tiêu Chuẩn Vận Hành
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Lưu trữ quy trình bảo trì, vệ sinh buồng phòng, an toàn và cẩm nang dịch vụ nội bộ
          </p>
        </div>

        {canWrite && (
          <Link
            href="/admin/documents/new"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
          >
            <FiPlus className="w-4 h-4" />
            <span>Tải Lên Tài Liệu</span>
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <form method="get" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Tìm theo tiêu đề hoặc mô tả..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
          />
        </div>

        <div className="flex items-center gap-2">
          <FiFilter className="text-slate-400 w-4 h-4" />
          <select
            name="category"
            defaultValue={category ?? ''}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
          >
            <option value="">Tất cả danh mục</option>
            {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors">
          Lọc
        </button>
      </form>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-12 text-center text-slate-400">
          <FiFileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-serif text-base text-slate-700">Không tìm thấy tài liệu phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa hoặc danh mục khác</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, docs]) => (
            <div key={cat} className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <h2 className="font-serif text-base font-bold text-slate-900">
                  {DOC_CATEGORIES[cat] ?? cat}
                </h2>
                <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {docs.length} tài liệu
                </span>
              </div>

              <ul className="divide-y divide-slate-100">
                {docs.map((d) => {
                  const canEdit = canEditDocument(user, d);
                  return (
                    <li
                      key={d.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-amber-50/30 transition-colors gap-3"
                    >
                      <Link
                        href={`/admin/documents/${d.id}`}
                        className="flex items-start space-x-3.5 min-w-0 flex-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center shrink-0 text-sm mt-0.5">
                          <FiFileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm flex items-center gap-2 hover:text-[#866526] transition-colors">
                            <span>{d.title}</span>
                            {!d.isActive && (
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-normal">
                                Đã ẩn
                              </span>
                            )}
                          </p>
                          {d.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{d.description}</p>
                          )}
                        </div>
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] border border-slate-200">
                          <FiUsers className="w-3 h-3 text-slate-400" />
                          <span>{VISIBILITY_LABELS[d.visibility]}</span>
                        </span>
                        {d.fileName && (
                          <span className="text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px]">
                            📄 {d.fileName}
                          </span>
                        )}
                        {canEdit && (
                          <>
                            <Link
                              href={`/admin/documents/${d.id}?edit=1`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <FiEdit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </Link>
                            <AdminDeleteButton
                              endpoint={`/api/internal/documents/${d.id}`}
                              itemName={d.title}
                              entityLabel="tài liệu"
                              variant="table"
                              warningNote={
                                d.fileName
                                  ? `Tệp đính kèm "${d.fileName}" cũng sẽ bị xóa khỏi máy chủ.`
                                  : undefined
                              }
                            />
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
