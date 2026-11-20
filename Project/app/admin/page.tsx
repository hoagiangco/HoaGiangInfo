import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth/guard';
import { hasPermission, ROLE_LABELS } from '@/lib/auth/permissions';
import { documentVisibilityWhere } from '@/lib/documents';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiAlertTriangle, 
  FiBox, 
  FiMenu, 
  FiBriefcase, 
  FiMap, 
  FiArrowUpRight,
  FiPlusCircle
} from 'react-icons/fi';

export default async function AdminDashboard() {
  const user = await requireUser();
  const canContent = hasPermission(user, 'content.manage');
  const canDocs = hasPermission(user, 'documents.read');
  const canFeedbackAll = hasPermission(user, 'feedback.read');
  const canFeedbackMine = hasPermission(user, 'feedback.read.assigned');

  try {
    const feedbackScope = canFeedbackAll
      ? {}
      : { assigneeId: user.id };

    const [docsCount, newFeedback, lowFeedback, content] = await Promise.all([
      canDocs
        ? prisma.technicalDocument.count({
            where: { isActive: true, ...documentVisibilityWhere(user) },
          })
        : Promise.resolve(0),
      canFeedbackAll || canFeedbackMine
        ? prisma.feedback.count({ where: { ...feedbackScope, status: 'NEW' } })
        : Promise.resolve(0),
      canFeedbackAll || canFeedbackMine
        ? prisma.feedback.count({
            where: { ...feedbackScope, status: { not: 'RESOLVED' }, overallRating: { lte: 2 } },
          })
        : Promise.resolve(0),
      canContent
        ? Promise.all([
            prisma.qRCode.count(),
            prisma.menu.count(),
            prisma.service.count(),
            prisma.floorPlan.count(),
          ])
        : Promise.resolve(null),
    ]);

    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#0B1120] via-[#151F32] to-[#0F172A] rounded-3xl p-8 lg:p-10 text-white shadow-xl border border-[#223147] relative overflow-hidden">
          {/* Subtle gold ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C5A456]/20 to-transparent rounded-bl-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A38035]/20 border border-[#A38035]/40 text-[#E6D3A7] text-[10px] font-bold uppercase tracking-[0.25em] mb-4">
              <span>HÒA BÌNH RẠCH GIÁ RESORT</span>
              <span>·</span>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Xin chào, {user.name}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Hệ thống vận hành thông tin khách hàng, quản lý kho tài liệu nội bộ bảo mật và điều phối phản hồi dịch vụ chuẩn 4 sao.
            </p>

            {/* Quick action buttons in header */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#223147]">
              {canDocs && (
                <Link
                  href="/admin/documents/new"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md transition-all"
                >
                  <FiPlusCircle className="w-4 h-4" />
                  <span>Tải Lên Tài Liệu</span>
                </Link>
              )}
              {canContent && (
                <Link
                  href="/admin/qr-codes/new"
                  className="inline-flex items-center space-x-2 bg-[#1E293B] hover:bg-[#2A3B54] text-slate-200 border border-[#334155] px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all"
                >
                  <FiPlusCircle className="w-4 h-4 text-[#C5A456]" />
                  <span>Tạo Mã QR Mới</span>
                </Link>
              )}
              {(canFeedbackAll || canFeedbackMine) && (
                <Link
                  href="/admin/feedback"
                  className="inline-flex items-center space-x-2 bg-[#1E293B] hover:bg-[#2A3B54] text-slate-200 border border-[#334155] px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all"
                >
                  <FiMessageSquare className="w-4 h-4 text-[#C5A456]" />
                  <span>Hộp Thư Phản Hồi</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Priority Alerts / Highlights */}
        {(canFeedbackAll || canFeedbackMine) && lowFeedback > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-rose-900 text-sm">
                  Cần xử lý gấp: Có {lowFeedback} phản hồi tiêu cực (≤ 2 sao) chưa được giải quyết!
                </p>
                <p className="text-xs text-rose-600 mt-0.5">
                  Vui lòng kiểm tra và phân công nhân viên liên hệ chăm sóc khách hàng kịp thời.
                </p>
              </div>
            </div>
            <Link
              href="/admin/feedback?status=OPEN&maxRating=2"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all shrink-0"
            >
              <span>Xử lý ngay</span>
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Primary Metric Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9C752B] mb-4">
            CHỈ SỐ VẬN HÀNH & NỘI BỘ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {canDocs && (
              <Link
                href="/admin/documents"
                className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 group-hover:text-[#866526] transition-colors">
                    <FiArrowUpRight className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tài Liệu Nội Bộ
                  </p>
                  <p className="font-serif text-3xl font-bold text-slate-900 mt-1">
                    {docsCount} <span className="text-xs font-sans font-normal text-slate-400">tài liệu khả dụng</span>
                  </p>
                </div>
              </Link>
            )}

            {(canFeedbackAll || canFeedbackMine) && (
              <Link
                href="/admin/feedback?status=NEW"
                className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl">
                    <FiMessageSquare className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 group-hover:text-blue-600 transition-colors">
                    <FiArrowUpRight className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phản Hồi Mới Chưa Xem
                  </p>
                  <p className="font-serif text-3xl font-bold text-blue-600 mt-1">
                    {newFeedback} <span className="text-xs font-sans font-normal text-slate-400">cần tiếp nhận</span>
                  </p>
                </div>
              </Link>
            )}

            {content && (
              <Link
                href="/admin/qr-codes"
                className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-luxury-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl">
                    <FiBox className="w-6 h-6" />
                  </div>
                  <span className="text-slate-400 group-hover:text-emerald-600 transition-colors">
                    <FiArrowUpRight className="w-5 h-5" />
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mã QR Đang Triển Khai
                  </p>
                  <p className="font-serif text-3xl font-bold text-slate-900 mt-1">
                    {content[0]} <span className="text-xs font-sans font-normal text-slate-400">bàn / phòng</span>
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Content CMS Shortcuts */}
        {content && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#9C752B] mb-4">
              NỘI DUNG PHỤC VỤ KHÁCH HÀNG
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                href="/admin/menu"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card hover:border-[#E6D3A7] transition-all flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#866526] border border-[#E6D3A7] flex items-center justify-center shrink-0">
                  <FiMenu className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-none">{content[1]}</p>
                  <p className="text-xs text-slate-500 mt-1">Menu ẩm thực</p>
                </div>
              </Link>

              <Link
                href="/admin/services"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card hover:border-[#E6D3A7] transition-all flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                  <FiBriefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-none">{content[2]}</p>
                  <p className="text-xs text-slate-500 mt-1">Dịch vụ & Spa</p>
                </div>
              </Link>

              <Link
                href="/admin/floor-plans"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card hover:border-[#E6D3A7] transition-all flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                  <FiMap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-none">{content[3]}</p>
                  <p className="text-xs text-slate-500 mt-1">Sơ đồ khuôn viên</p>
                </div>
              </Link>

              <Link
                href="/admin/feedback"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card hover:border-[#E6D3A7] transition-all flex items-center space-x-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                  <FiMessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg leading-none">Hộp thư</p>
                  <p className="text-xs text-slate-500 mt-1">Ý kiến khách</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
        <h2 className="font-bold text-base mb-1">Không tải được dữ liệu dashboard</h2>
        <p className="text-sm">Vui lòng kiểm tra lại kết nối cơ sở dữ liệu PostgreSQL.</p>
      </div>
    );
  }
}
