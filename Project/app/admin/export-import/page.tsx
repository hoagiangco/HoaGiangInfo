'use client';

import { useState } from 'react';

export default function ExportImportPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleExport(type: string) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/export?type=${type}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resort-data-${type}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Export thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Export thất bại' });
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

      const mode = confirm('Replace existing data? (Cancel to merge)')
        ? 'replace'
        : 'merge';

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: `Import thành công! ${JSON.stringify(result.results)}`,
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Import thất bại' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Export / Import Data
      </h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Export</h2>
          <p className="text-gray-600 mb-4">
            Tải xuống dữ liệu dưới dạng JSON
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleExport('all')}
              disabled={loading}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
            >
              Export Tất Cả
            </button>
            <button
              onClick={() => handleExport('qr')}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
            >
              Export QR Codes
            </button>
            <button
              onClick={() => handleExport('menu')}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
            >
              Export Menus
            </button>
            <button
              onClick={() => handleExport('services')}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
            >
              Export Services
            </button>
            <button
              onClick={() => handleExport('information')}
              disabled={loading}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
            >
              Export Information
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Import</h2>
          <p className="text-gray-600 mb-4">
            Tải lên file JSON để import dữ liệu
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn file JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              Chọn "Replace" để thay thế dữ liệu hiện có, hoặc "Merge" để hợp nhất
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}










