'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
  id: string;
  name: string;
  displayName: string;
}

interface QRCode {
  id: string;
  name: string;
  token: string;
  description: string | null;
  type: string;
  isActive: boolean;
  modules: Array<{ module: Module }>;
}

interface QRCodeEditFormProps {
  qrCode: QRCode;
  allModules: Module[];
}

export default function QRCodeEditForm({
  qrCode,
  allModules,
}: QRCodeEditFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: qrCode.name,
    token: qrCode.token,
    description: qrCode.description || '',
    type: qrCode.type,
    isActive: qrCode.isActive,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>(
    qrCode.modules.map((m) => m.module.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Update QR code
      const response = await fetch(`/api/qr/${qrCode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update QR code');
      }

      // Update modules
      const currentModuleIds = qrCode.modules.map((m) => m.module.id);
      const toAdd = selectedModules.filter((id) => !currentModuleIds.includes(id));
      const toRemove = currentModuleIds.filter((id) => !selectedModules.includes(id));

      for (const moduleId of toAdd) {
        await fetch(`/api/qr/${qrCode.id}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId }),
        });
      }

      for (const moduleId of toRemove) {
        await fetch(`/api/qr/${qrCode.id}/modules?moduleId=${moduleId}`, {
          method: 'DELETE',
        });
      }

      router.push('/admin/qr-codes');
      router.refresh();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(moduleId: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Token
        </label>
        <input
          type="text"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="guest">Guest</option>
          <option value="staff">Staff</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modules
        </label>
        <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
          {allModules.map((module) => (
            <label
              key={module.id}
              className="flex items-center space-x-2 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => toggleModule(module.id)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">{module.displayName}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}







