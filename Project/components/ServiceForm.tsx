'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  hours: string | null;
  location: string | null;
  isActive: boolean;
}

interface ServiceFormProps {
  service?: Service;
}

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: service?.name || '',
    type: service?.type || 'gym',
    description: service?.description || '',
    hours: service?.hours || '',
    location: service?.location || '',
    isActive: service?.isActive !== undefined ? service.isActive : true,
  });
  const [images, setImages] = useState<string[]>(service?.images || []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = service ? `/api/services/${service.id}` : '/api/services';
      const method = service ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save service');
      }

      router.push('/admin/services');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  function addImage() {
    const url = prompt('Enter image URL:');
    if (url) {
      setImages([...images, url]);
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
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
          Tên Service *
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
          Loại
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="gym">Gym</option>
          <option value="bar">Bar</option>
          <option value="business-center">Business Center</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giờ mở cửa
          </label>
          <input
            type="text"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            placeholder="06:00 - 22:00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vị trí
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Tầng 1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hình ảnh (URLs)
        </label>
        <div className="space-y-2">
          {images.map((img, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={img}
                onChange={(e) => {
                  const newImages = [...images];
                  newImages[index] = e.target.value;
                  setImages(newImages);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded"
                placeholder="Image URL"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addImage}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            + Thêm Image URL
          </button>
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
          {loading ? 'Đang lưu...' : 'Lưu Service'}
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










