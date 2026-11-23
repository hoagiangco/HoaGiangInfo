import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiStar, FiEdit3, FiClock, FiCheckCircle } from 'react-icons/fi';
import { MdSpa, MdFitnessCenter, MdLocalBar, MdPool } from 'react-icons/md';
import {
  getAvailableLanguages,
  type ServiceTranslationFields,
} from '@/lib/translations';
import TranslationBadges from '@/components/TranslationBadges';
import AdminDeleteButton from '@/components/AdminDeleteButton';

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
  });

  const totalCount = services.length;
  const activeCount = services.filter((s) => s.isActive).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            TIỆN ÍCH NGHỈ DƯỠNG
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Dịch Vụ & Tiện Ích
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Cấu hình danh mục spa, fitness, hồ bơi, dịch vụ phòng và hoạt động giải trí
          </p>
        </div>

        <Link
          href="/admin/services/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Dịch Vụ Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiStar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số dịch vụ</p>
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
      </div>

      {/* Luxury Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Danh Sách Tiện Ích Hiện Có
          </h2>
          <span className="text-xs text-slate-500">
            {services.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên Dịch Vụ</th>
                <th className="px-6 py-4">Phân Loại (Type)</th>
                <th className="px-6 py-4">Ngôn Ngữ</th>
                <th className="px-6 py-4">Giờ Mở Cửa</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-serif font-bold text-slate-900">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-[#866526] uppercase">
                    <span className="bg-[#FAF7EE] border border-[#E6D3A7]/60 px-2.5 py-1 rounded-md">
                      {service.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TranslationBadges
                      availableLangs={getAvailableLanguages<ServiceTranslationFields>(
                        service.translations,
                        ['name', 'description', 'hours', 'location']
                      )}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                    {service.hours || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        service.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {service.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/services/${service.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3 py-1.5 rounded-lg transition-all"
                      >
                        <FiEdit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </Link>
                      <AdminDeleteButton
                        endpoint={`/api/services/${service.id}`}
                        itemName={service.name}
                        entityLabel="dịch vụ"
                        variant="table"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
