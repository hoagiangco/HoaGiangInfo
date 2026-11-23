import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import { formatDateTimeVN, formatNumberVN } from '@/lib/locale';
import { FiShield, FiFilter, FiActivity } from 'react-icons/fi';

const PAGE_SIZE = 50;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { action?: string; page?: string };
}) {
  await requirePermission('audit.view');

  const page = Math.max(1, Number(searchParams.page) || 1);
  const action = searchParams.action?.slice(0, 50);
  const where = action ? { action: { startsWith: action } } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          GIÁM SÁT AN TOÀN & BẢO MẬT
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Nhật Ký Kiểm Toán (Audit Trail)
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Ghi nhận minh bạch mọi thao tác đăng nhập, tải tài liệu, phân quyền và điều phối phản hồi
        </p>
      </div>

      {/* Filter */}
      <form method="get" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <FiFilter className="text-slate-400 w-4 h-4 ml-1" />
        <select
          name="action"
          defaultValue={action ?? ''}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
        >
          <option value="">Tất cả hoạt động</option>
          <option value="auth.">Xác thực & Mật khẩu (auth.*)</option>
          <option value="document.">Tài liệu nội bộ (document.*)</option>
          <option value="feedback.">Xử lý phản hồi (feedback.*)</option>
          <option value="footer.">Cấu hình Footer (footer.*)</option>
          <option value="user.">Quản trị người dùng (user.*)</option>
        </select>
        <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors">
          Lọc
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Thời Gian</th>
                <th className="px-6 py-4">Tài Khoản</th>
                <th className="px-6 py-4">Hành Động</th>
                <th className="px-6 py-4">Đối Tượng</th>
                <th className="px-6 py-4">Địa Chỉ IP</th>
                <th className="px-6 py-4">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    Chưa có sự kiện nào được ghi nhận
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                      {formatDateTimeVN(l.createdAt, { withSeconds: true })}
                    </td>
                    <td className="px-6 py-3 text-xs font-semibold text-slate-900">
                      {l.userEmail || <span className="text-slate-400 italic">Hệ thống</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block font-mono text-[11px] font-semibold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-2 py-0.5 rounded">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-600">
                      {l.entity ? `${l.entity}:${l.entityId?.slice(-6) ?? ''}` : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                      {l.ipAddress ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate font-mono">
                      {l.meta ? JSON.stringify(l.meta) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center">Trang {page} / {pages} · Tổng cộng {formatNumberVN(total)} sự kiện kiểm toán (giờ Việt Nam, GMT+7)</p>
    </div>
  );
}
