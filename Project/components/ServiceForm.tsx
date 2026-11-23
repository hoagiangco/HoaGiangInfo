'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLanguageTabs from './AdminLanguageTabs';
import AdminDeleteButton from './AdminDeleteButton';
import type { Language } from '@/lib/i18n';
import {
  parseTranslations,
  type ServiceTranslationFields,
  type TranslationMap,
} from '@/lib/translations';

interface Service {
  id: string;
  name: string;
  type: string;
  description: string;
  translations?: unknown;
  images: string[];
  hours: string | null;
  location: string | null;
  isActive: boolean;
}

interface ServiceFormProps {
  service?: Service;
}

const SERVICE_TYPES = [
  { value: 'gym', label: 'Gym & Fitness' },
  { value: 'bar', label: 'Bar & Lounge' },
  { value: 'business-center', label: 'Business Center' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'pool', label: 'Hồ Bơi (Pool)' },
  { value: 'restaurant', label: 'Nhà Hàng (Restaurant)' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'other', label: 'Tiện ích khác (Other)' },
];

export default function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter();
  const initialTranslations = parseTranslations<ServiceTranslationFields>(
    service?.translations
  );

  const [activeLang, setActiveLang] = useState<Language>('vi');
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
  const [translations, setTranslations] = useState<
    TranslationMap<ServiceTranslationFields>
  >({
    en: {
      name: initialTranslations.en?.name || '',
      description: initialTranslations.en?.description || '',
      hours: initialTranslations.en?.hours || '',
      location: initialTranslations.en?.location || '',
    },
    zh: {
      name: initialTranslations.zh?.name || '',
      description: initialTranslations.zh?.description || '',
      hours: initialTranslations.zh?.hours || '',
      location: initialTranslations.zh?.location || '',
    },
  });
  const [images, setImages] = useState<string[]>(service?.images || []);

  function updateField(
    field: keyof ServiceTranslationFields,
    value: string
  ) {
    if (activeLang === 'vi') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setTranslations((prev) => ({
        ...prev,
        [activeLang]: {
          ...(prev[activeLang] || {}),
          [field]: value,
        },
      }));
    }
  }

  function getFieldValue(field: keyof ServiceTranslationFields): string {
    if (activeLang === 'vi') {
      return formData[field] || '';
    }
    return translations[activeLang]?.[field] || '';
  }

  const filled = {
    vi: Boolean(formData.name.trim()),
    en: Boolean(
      translations.en?.name?.trim() ||
        translations.en?.description?.trim() ||
        translations.en?.hours?.trim() ||
        translations.en?.location?.trim()
    ),
    zh: Boolean(
      translations.zh?.name?.trim() ||
        translations.zh?.description?.trim() ||
        translations.zh?.hours?.trim() ||
        translations.zh?.location?.trim()
    ),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      setActiveLang('vi');
      setError('Vui lòng nhập Tên và Mô tả bằng Tiếng Việt (mặc định).');
      return;
    }

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
          translations,
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

  const hasCustomType =
    formData.type && !SERVICE_TYPES.some((t) => t.value === formData.type);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 space-y-6"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <AdminLanguageTabs
        activeLang={activeLang}
        onChange={setActiveLang}
        filled={filled}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên Dịch Vụ ({activeLang.toUpperCase()})
          {activeLang === 'vi' && ' *'}
        </label>
        <input
          type="text"
          value={getFieldValue('name')}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? formData.name || 'e.g., Gym & Fitness Center'
              : activeLang === 'zh'
              ? formData.name || '例如：健身中心'
              : 'Ví dụ: Phòng Gym & Fitness'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required={activeLang === 'vi'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả ({activeLang.toUpperCase()})
          {activeLang === 'vi' && ' *'}
        </label>
        <textarea
          value={getFieldValue('description')}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? 'English description...'
              : activeLang === 'zh'
              ? '中文服务介绍...'
              : 'Mô tả chi tiết dịch vụ...'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={4}
          required={activeLang === 'vi'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Giờ mở cửa ({activeLang.toUpperCase()})
          </label>
          <input
            type="text"
            value={getFieldValue('hours')}
            onChange={(e) => updateField('hours', e.target.value)}
            placeholder={
              activeLang === 'en'
                ? formData.hours || '06:00 - 22:00 (Daily)'
                : activeLang === 'zh'
                ? formData.hours || '06:00 - 22:00（每日）'
                : '06:00 - 22:00'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vị trí ({activeLang.toUpperCase()})
          </label>
          <input
            type="text"
            value={getFieldValue('location')}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder={
              activeLang === 'en'
                ? formData.location || '2nd Floor'
                : activeLang === 'zh'
                ? formData.location || '2楼'
                : 'Tầng 2'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="border-t pt-6 space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Cấu hình chung (dùng cho mọi ngôn ngữ)
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phân loại (Type)
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
            {hasCustomType && (
              <option value={formData.type}>{formData.type}</option>
            )}
          </select>
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
            <span className="text-sm font-medium text-gray-700">
              Hoạt động (Active)
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu Dịch Vụ'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Hủy
        </button>
        {service && (
          <AdminDeleteButton
            endpoint={`/api/services/${service.id}`}
            itemName={service.name}
            entityLabel="dịch vụ"
            redirectTo="/admin/services"
            variant="form"
            disabled={loading}
            className="ml-auto"
          />
        )}
      </div>
    </form>
  );
}
