'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string;
  isPublic: boolean;
}

interface ModuleFormProps {
  module?: Module;
}

export default function ModuleForm({ module }: ModuleFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: module?.name || '',
    displayName: module?.displayName || '',
    description: module?.description || '',
    icon: module?.icon || '',
    route: module?.route || '',
    isPublic: module?.isPublic ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const method = module ? 'PUT' : 'POST';
      const url = module
        ? `/api/modules/${module.id}`
        : '/api/modules';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save module');
      }

      router.push('/admin/modules');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save module');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên kỹ thuật (ví dụ: menu, floor-plan) *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên hiển thị *
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) =>
            setFormData({ ...formData, displayName: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Route (ví dụ: /menu, /floor-plan) *
        </label>
        <input
          type="text"
          value={formData.route}
          onChange={(e) =>
            setFormData({ ...formData, route: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icon (emoji hoặc class)
        </label>
        <input
          type="text"
          value={formData.icon}
          onChange={(e) =>
            setFormData({ ...formData, icon: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="Ví dụ: 🍽️, 🛎️, 🗺️"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={(e) =>
              setFormData({ ...formData, isPublic: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Public (hiển thị cho tất cả QR nếu chưa cấu hình riêng)
          </span>
        </label>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu Module'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/modules')}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}





