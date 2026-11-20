import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FiPlus, FiBox, FiCheckCircle, FiEdit3, FiEye } from 'react-icons/fi';

export default async function ModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { displayName: 'asc' },
  });

  const totalCount = modules.length;
  const publicCount = modules.filter((m) => m.isPublic).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            DANH MỤC PHÂN HỆ HỆ THỐNG
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Quản Lý Modules Dịch Vụ
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Định cấu hình các phân hệ tính năng hiển thị cho khách hàng và nhân viên
          </p>
        </div>

        <Link
          href="/admin/modules/new"
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Tạo Module Mới</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xl shrink-0">
            <FiBox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số phân hệ</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
            <FiEye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Công khai cho khách</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{publicCount}</p>
          </div>
        </div>
      </div>

      {/* Luxury Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Danh Sách Phân Hệ Tính Năng
          </h2>
          <span className="text-xs text-slate-500">
            {modules.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã Module</th>
                <th className="px-6 py-4">Tên Hiển Thị (Display Name)</th>
                <th className="px-6 py-4">Đường Dẫn (Route)</th>
                <th className="px-6 py-4">Khách Truy Cập</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-900">
                    {module.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-serif font-medium text-slate-900">
                    {module.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                    {module.route}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        module.isPublic
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${module.isPublic ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {module.isPublic ? 'Cho phép' : 'Nội bộ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/admin/modules/${module.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#866526] hover:text-[#684B1B] bg-[#FAF7EE] border border-[#E6D3A7]/60 hover:bg-[#F3EAD7] px-3 py-1.5 rounded-lg transition-all"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </Link>
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
