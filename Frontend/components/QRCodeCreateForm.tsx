'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
  id: string;
  name: string;
  displayName: string;
}

interface QRCodeCreateFormProps {
  allModules: Module[];
}

export default function QRCodeCreateForm({ allModules }: QRCodeCreateFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    description: '',
    type: 'custom',
    isActive: true,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create QR code
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create QR code');
      }

      const qrCode = await response.json();

      // Assign modules
      for (const moduleId of selectedModules) {
        await fetch(`/api/qr/${qrCode.id}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId }),
        });
      }

      router.push('/admin/qr-codes');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo QR code');
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
          Tên *
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
          Token * (phải là duy nhất)
        </label>
        <input
          type="text"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
          placeholder="vd: room-101"
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
          Modules (chọn modules QR code này có thể truy cập)
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
          {loading ? 'Đang tạo...' : 'Tạo QR Code'}
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







