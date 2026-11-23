import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import { hasPermission } from '@/lib/auth/permissions';
import {
  buildFeedbackWhere,
  STATUS_LABELS,
  VENUE_LABELS,
  type FeedbackFilters,
} from '@/lib/feedback';
import { FiDownload, FiMessageSquare, FiStar, FiTrendingUp, FiSearch, FiFilter } from 'react-icons/fi';
import { formatDateTimeVN, formatNumberVN } from '@/lib/locale';
import AdminDeleteButton from '@/components/AdminDeleteButton';

const PAGE_SIZE = 25;

const statusBadge: Record<string, { bg: string; text: string; dot: string }> = {
  NEW: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-[#866526]', dot: 'bg-[#B58E38]' },
  RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export default async function FeedbackListPage({
  searchParams,
}: {
  searchParams: FeedbackFilters & { page?: string };
}) {
  const user = await requirePermission('feedback.read', 'feedback.read.assigned');
  const seesAll = hasPermission(user, 'feedback.read');
  const canExport = hasPermission(user, 'feedback.export');
  const canManage = hasPermission(user, 'feedback.manage');

  const where = buildFeedbackWhere(user, searchParams);
  const page = Math.max(1, Number(searchParams.page) || 1);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const scope = buildFeedbackWhere(user, {});

  const [items, total, recent] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where: { AND: [scope, { createdAt: { gte: since } }] },
      select: { overallRating: true, npsScore: true },
    }),
  ]);

  const avg = recent.length ? recent.reduce((s, r) => s + r.overallRating, 0) / recent.length : 0;
  const nps = recent.filter((r) => r.npsScore !== null);
  const npsValue = nps.length
    ? Math.round(
        ((nps.filter((r) => r.npsScore! >= 9).length - nps.filter((r) => r.npsScore! <= 6).length) / nps.length) * 100
      )
    : null;

  const qs = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (typeof v === 'string' && v && k !== 'page') qs.set(k, v);
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => `/admin/feedback?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(p) })}`;

  const input = 'px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            DỊCH VỤ KHÁCH HÀNG & TRẢI NGHIỆM
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Hộp Thư Phản Hồi Khách Hàng {!seesAll && <span className="text-base font-normal text-slate-500">(được giao cho bạn)</span>}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Theo dõi ý kiến đánh giá từ khách lưu trú, kịp thời xử lý khiếu nại và nâng cấp chất lượng phục vụ
          </p>
        </div>

        {canExport && (
          <a
            href={`/api/internal/feedback/export?${qs}`}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-sm transition-all shrink-0"
          >
            <FiDownload className="w-4 h-4" />
            <span>Xuất Báo Cáo CSV</span>
          </a>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shrink-0">
            <FiMessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lượt phản hồi (30 ngày)</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{formatNumberVN(recent.length)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiStar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Điểm hài lòng TB</p>
            <p className="text-2xl font-bold text-[#866526] mt-0.5">
              {recent.length ? avg.toFixed(2) : '-'} <span className="text-lg">★</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiTrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chỉ số NPS (Khuyên dùng)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{npsValue !== null ? `+${npsValue}` : '-'}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <form method="get" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Tìm trong nhận xét, số phòng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
          />
        </div>

        <select name="status" defaultValue={searchParams.status ?? ''} className={input}>
          <option value="">Mọi trạng thái</option>
          <option value="OPEN">Chưa xử lý xong</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select name="venue" defaultValue={searchParams.venue ?? ''} className={input}>
          <option value="">Mọi khu vực</option>
          {Object.entries(VENUE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select name="maxRating" defaultValue={searchParams.maxRating ?? ''} className={input}>
          <option value="">Mọi điểm sao</option>
          <option value="2">≤ 2 sao (Cần ưu tiên)</option>
          <option value="3">≤ 3 sao</option>
          <option value="4">≤ 4 sao</option>
        </select>

        <input type="date" name="from" defaultValue={searchParams.from} className={input} />
        <input type="date" name="to" defaultValue={searchParams.to} className={input} />

        <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors">
          Lọc
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FiMessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-serif text-base text-slate-700">Không có phản hồi nào</p>
            <p className="text-xs text-slate-400 mt-1">Hệ thống chưa ghi nhận phản hồi theo tiêu chí đã chọn</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Thời Gian</th>
                  <th className="px-6 py-4">Đánh Giá</th>
                  <th className="px-6 py-4">Khu Vực & Phòng</th>
                  <th className="px-6 py-4">Nội Dung Nhận Xét</th>
                  <th className="px-6 py-4">Trạng Thái</th>
                  <th className="px-6 py-4">Người Xử Lý</th>
                  {canManage && <th className="px-6 py-4 text-right">Thao Tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((f) => {
                  const badge = statusBadge[f.status] || statusBadge.NEW;
                  return (
                    <tr key={f.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <Link href={`/admin/feedback/${f.id}`} className="font-semibold text-[#866526] hover:underline">
                          {formatDateTimeVN(f.createdAt)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                          f.overallRating <= 2 ? 'text-rose-600' : 'text-[#866526]'
                        }`}>
                          <span>{f.overallRating}</span>
                          <span>★</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700">
                        <span className="font-semibold">{VENUE_LABELS[f.venue] ?? f.venue}</span>
                        {f.location && <span className="text-slate-400 ml-1">({f.location})</span>}
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {f.comment || <span className="text-slate-300 italic">Không có nhận xét viết thêm</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{STATUS_LABELS[f.status]}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {f.assignee?.name ? (
                          <span className="font-medium text-slate-800">{f.assignee.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa giao</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <AdminDeleteButton
                            endpoint={`/api/internal/feedback/${f.id}`}
                            itemName={`${VENUE_LABELS[f.venue] ?? f.venue} (${f.overallRating}★)`}
                            entityLabel="phản hồi"
                            variant="table"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center items-center gap-4 text-xs font-semibold">
          {page > 1 && (
            <Link href={link(page - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              ← Trang Trước
            </Link>
          )}
          <span className="text-slate-500">Trang {page} / {pages}</span>
          {page < pages && (
            <Link href={link(page + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              Trang Sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
