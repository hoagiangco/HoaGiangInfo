'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CKEditorComponent from './CKEditor';

interface Information {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface InformationFormProps {
  information?: Information;
}

// Component CKEditor - đã tích hợp table sẵn
function ContentEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="ckeditor-wrapper" style={{ minHeight: '300px' }}>
      <CKEditorComponent
        value={value}
        onChange={onChange}
        placeholder="Nhập nội dung..."
      />
    </div>
  );
}

export default function InformationForm({ information }: InformationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    category: information?.category || 'wifi',
    title: information?.title || '',
    content: information?.content || '',
    icon: information?.icon || '',
    order: information?.order || 0,
    isActive: information?.isActive !== undefined ? information.isActive : true,
  });

  // Load CKEditor
  useEffect(() => {
    // CKEditor sẽ tự load CSS
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = information
        ? `/api/information/${information.id}`
        : '/api/information';
      const method = information ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save information');
      }

      router.push('/admin/information');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
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
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="wifi">WiFi</option>
          <option value="phone">Phone</option>
          <option value="tv">TV Channels</option>
          <option value="room-info">Room Info</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content *
        </label>
        {mounted ? (
          <ContentEditor
            value={formData.content}
            onChange={(value) =>
              setFormData({ ...formData, content: value })
            }
          />
        ) : (
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={6}
            placeholder="Đang tải editor..."
            disabled
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon (Emoji)
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="📶"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order
          </label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
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

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu Information'}
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







