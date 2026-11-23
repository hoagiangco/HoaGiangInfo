import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import QRCodeGenerator from '@/components/QRCodeGenerator';
import AdminDeleteButton from '@/components/AdminDeleteButton';
import { FiPlus, FiBox, FiEdit3, FiCheckCircle, FiXCircle, FiLayers } from 'react-icons/fi';

export default async function QRCodesPage() {
  const qrCodes = await prisma.qRCode.findMany({
    include: {
      modules: {
        include: {
          module: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalCount = qrCodes.length;
  const activeCount = qrCodes.filter((q) => q.isActive).length;
  const guestCount = qrCodes.filter((q) => q.type === 'guest').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            HỆ THỐNG MÃ QR RESORT
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Mã QR Bàn & Phòng
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Khởi tạo và phân quyền mã QR cho từng phòng nghỉ, biệt thự hoặc bàn tiệc
          </p>
        </div>

        <Link
          href="/admin/qr-codes/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo QR Code Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiBox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số mã QR</p>
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
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xl shrink-0">
            <FiLayers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dành cho khách (Guest)</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{guestCount}</p>
          </div>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Danh Sách Mã QR Hiện Tại
          </h2>
          <span className="text-xs text-slate-500">
            {qrCodes.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên & Mô Tả</th>
                <th className="px-6 py-4">Token Truy Cập</th>
                <th className="px-6 py-4">Phân Loại</th>
                <th className="px-6 py-4">Modules Gán Kèm</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {qrCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Chưa có mã QR nào được tạo. Nhấn "Tạo QR Code Mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                qrCodes.map((qr) => (
                  <tr key={qr.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center shrink-0 text-xs">
                          <FiBox className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{qr.name}</p>
                          {qr.description && (
                            <p className="text-xs text-slate-500 max-w-xs truncate">{qr.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Token */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {qr.token}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        qr.type === 'guest'
                          ? 'bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7]'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {qr.type === 'guest' ? 'Khách hàng' : qr.type}
                      </span>
                    </td>

                    {/* Modules */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {qr.modules.slice(0, 3).map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                          >
                            {m.module.displayName}
                          </span>
                        ))}
                        {qr.modules.length > 3 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            +{qr.modules.length - 3}
                          </span>
                        )}
                        {qr.modules.length === 0 && (
                          <span className="text-xs text-slate-400">Chưa gán</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          qr.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${qr.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{qr.isActive ? 'Hoạt động' : 'Tạm ẩn'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <QRCodeGenerator token={qr.token} />
                        <Link
                          href={`/admin/qr-codes/${qr.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </Link>
                        <AdminDeleteButton
                          endpoint={`/api/qr/${qr.id}`}
                          itemName={`${qr.name} (${qr.token})`}
                          entityLabel="mã QR"
                          variant="table"
                          warningNote="Lịch sử quét của mã QR này cũng sẽ bị xóa theo."
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
