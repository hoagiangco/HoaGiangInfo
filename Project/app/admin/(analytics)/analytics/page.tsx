'use client';

import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { formatDateVN, formatNumberVN } from '@/lib/locale';
import { FiBarChart2, FiBox, FiGrid, FiActivity } from 'react-icons/fi';

interface AnalyticsData {
  totalScans: number;
  scansByQR: Array<{ qrCodeName: string; qrCodeToken: string; count: number }>;
  scansByDay: Array<{ date: string; count: number }>;
  moduleStats: Array<{ moduleName: string; qrCodeCount: number }>;
  period: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics?days=${days}`);
        if (!response.ok) throw new Error('Không thể tải dữ liệu thống kê');
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [days]);

  if (loading) return <Loading />;
  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500">
        Không có dữ liệu thống kê khả dụng
      </div>
    );
  }

  const maxDailyCount = Math.max(...data.scansByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
            BÁO CÁO & HIỆU SUẤT QR
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
            Thống Kê & Lượt Quét QR
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Theo dõi lượt truy cập từ khách lưu trú theo mã QR và phân hệ dịch vụ (giờ Việt Nam, GMT+7)
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
        >
          <option value={7}>7 ngày qua</option>
          <option value={30}>30 ngày qua</option>
          <option value={90}>90 ngày qua</option>
          <option value={365}>1 năm qua</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center shrink-0">
            <FiActivity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tổng lượt quét
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-0.5">
              {formatNumberVN(data.totalScans)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{data.period} ngày qua</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <FiBox className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Mã QR có lượt quét
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-0.5">
              {formatNumberVN(data.scansByQR.length)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Đang ghi nhận truy cập</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <FiGrid className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Phân hệ dịch vụ
            </p>
            <p className="text-3xl font-bold text-slate-900 mt-0.5">
              {formatNumberVN(data.moduleStats.length)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Đang triển khai</p>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4">
            Lượt Quét Theo Mã QR
          </h2>
          {data.scansByQR.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Chưa có lượt quét nào trong giai đoạn này
            </p>
          ) : (
            <div className="space-y-3">
              {[...data.scansByQR]
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div
                    key={item.qrCodeToken}
                    className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {item.qrCodeName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{item.qrCodeToken}</p>
                    </div>
                    <div className="text-xl font-bold text-[#866526]">
                      {formatNumberVN(item.count)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
          <h2 className="font-serif text-lg font-bold text-slate-900 mb-4">
            Phân Bổ Phân Hệ Theo Mã QR
          </h2>
          {data.moduleStats.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Chưa có phân hệ nào được gán
            </p>
          ) : (
            <div className="space-y-3">
              {[...data.moduleStats]
                .sort((a, b) => b.qrCodeCount - a.qrCodeCount)
                .map((item) => (
                  <div
                    key={item.moduleName}
                    className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl"
                  >
                    <p className="font-semibold text-slate-800 text-sm">
                      {item.moduleName}
                    </p>
                    <div className="text-sm font-bold text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
                      {formatNumberVN(item.qrCodeCount)} mã QR
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="w-5 h-5 text-[#866526]" />
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Lượt Quét Theo Ngày
          </h2>
        </div>
        {data.scansByDay.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">
            Chưa có dữ liệu theo ngày trong giai đoạn này
          </p>
        ) : (
          <div className="space-y-2.5">
            {data.scansByDay.map((day) => (
              <div key={day.date} className="flex items-center space-x-4">
                <div className="w-24 text-xs font-medium text-slate-600 tabular-nums">
                  {formatDateVN(day.date)}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#A38035] to-[#866526] h-6 rounded-full flex items-center justify-end pr-2.5 min-w-[2.25rem]"
                    style={{
                      width: `${(day.count / maxDailyCount) * 100}%`,
                    }}
                  >
                    <span className="text-xs text-white font-semibold tabular-nums">
                      {formatNumberVN(day.count)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
