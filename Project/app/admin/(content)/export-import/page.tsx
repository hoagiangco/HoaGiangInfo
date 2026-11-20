'use client';

import { useState } from 'react';
import {
  FiDownload,
  FiUploadCloud,
  FiDatabase,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText,
} from 'react-icons/fi';
import { MdRestaurantMenu, MdApartment, MdQrCode } from 'react-icons/md';

export default function ExportImportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleExport(type: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/export?type=${type}`);
      if (!response.ok) throw new Error('Export thất bại');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resort-data-${type}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: `Tải xuống dữ liệu ${type} thành công!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Xuất dữ liệu thất bại' });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const mode = confirm('Bạn có muốn THAY THẾ toàn bộ dữ liệu hiện có không? (Chọn Cancel để GỘP / MERGE thêm)')
        ? 'replace'
        : 'merge';

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import thất bại');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: `Nhập dữ liệu thành công! ${JSON.stringify(result.results)}`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Import thất bại' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          DỮ LIỆU & SAO LƯU
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Sao Lưu & Phục Hồi Dữ Liệu
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Xuất dữ liệu hệ thống ra tệp JSON để lưu trữ dự phòng hoặc nhập dữ liệu mẫu vào resort
        </p>
      </div>

      {/* Status Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-7 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center text-xl shrink-0">
              <FiDownload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Xuất Dữ Liệu (Export)
              </h2>
              <p className="text-slate-500 text-xs">
                Tải tệp JSON chứa cấu trúc dữ liệu theo từng phân hệ
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleExport('all')}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-5 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiDatabase className="w-4 h-4" />
              <span>Xuất toàn bộ hệ thống</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={() => handleExport('qr')}
                disabled={loading}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MdQrCode className="w-4 h-4 text-[#866526]" />
                <span>Mã QR</span>
              </button>
              <button
                onClick={() => handleExport('menu')}
                disabled={loading}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MdRestaurantMenu className="w-4 h-4 text-[#866526]" />
                <span>Thực đơn</span>
              </button>
              <button
                onClick={() => handleExport('services')}
                disabled={loading}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiFileText className="w-4 h-4 text-[#866526]" />
                <span>Dịch vụ</span>
              </button>
              <button
                onClick={() => handleExport('information')}
                disabled={loading}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FiFileText className="w-4 h-4 text-[#866526]" />
                <span>Cẩm nang</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-7 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center text-xl shrink-0">
                <FiUploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-slate-900">
                  Nhập Dữ Liệu (Import)
                </h2>
                <p className="text-slate-500 text-xs">
                  Phục hồi dữ liệu từ bản sao lưu định dạng .json
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#B58E38] transition-colors bg-slate-50/50">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={loading}
                  className="hidden"
                />
                <FiUploadCloud className="w-8 h-8 text-[#866526] mx-auto mb-2" />
                <span className="text-xs font-semibold text-slate-900 block">
                  Nhấp để tải lên tệp sao lưu JSON
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Hỗ trợ định dạng .json chuẩn Hoa Giang Resort
                </span>
              </label>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            Lưu ý: Bạn sẽ có tùy chọn <strong>Thay thế (Replace)</strong> toàn bộ dữ liệu hoặc <strong>Hợp nhất (Merge)</strong> với dữ liệu đang có trước khi tiến trình bắt đầu.
          </p>
        </div>
      </div>
    </div>
  );
}
