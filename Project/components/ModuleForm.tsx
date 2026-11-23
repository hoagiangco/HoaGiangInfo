'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLanguageTabs from './AdminLanguageTabs';
import AdminDeleteButton from './AdminDeleteButton';
import type { Language } from '@/lib/i18n';
import {
  parseTranslations,
  type ModuleTranslationFields,
  type TranslationMap,
} from '@/lib/translations';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  translations?: unknown;
  icon: string | null;
  route: string;
  isPublic: boolean;
}

interface ModuleFormProps {
  module?: Module;
}

export default function ModuleForm({ module }: ModuleFormProps) {
  const router = useRouter();
  const initialTranslations = parseTranslations<ModuleTranslationFields>(
    module?.translations
  );

  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [formData, setFormData] = useState({
    name: module?.name || '',
    displayName: module?.displayName || '',
    description: module?.description || '',
    icon: module?.icon || '',
    route: module?.route || '',
    isPublic: module?.isPublic ?? false,
  });
  const [translations, setTranslations] = useState<
    TranslationMap<ModuleTranslationFields>
  >({
    en: {
      displayName: initialTranslations.en?.displayName || '',
      description: initialTranslations.en?.description || '',
    },
    zh: {
      displayName: initialTranslations.zh?.displayName || '',
      description: initialTranslations.zh?.description || '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLocalized(
    field: keyof ModuleTranslationFields,
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

  function getLocalized(field: keyof ModuleTranslationFields): string {
    if (activeLang === 'vi') {
      return formData[field] || '';
    }
    return translations[activeLang]?.[field] || '';
  }

  const filled = {
    vi: Boolean(formData.displayName.trim()),
    en: Boolean(
      translations.en?.displayName?.trim() ||
        translations.en?.description?.trim()
    ),
    zh: Boolean(
      translations.zh?.displayName?.trim() ||
        translations.zh?.description?.trim()
    ),
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      setActiveLang('vi');
      setError('Vui lòng nhập Tên hiển thị bằng Tiếng Việt (mặc định).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const method = module ? 'PUT' : 'POST';
      const url = module ? `/api/modules/${module.id}` : '/api/modules';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          translations,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên hiển thị ({activeLang.toUpperCase()})
          {activeLang === 'vi' && ' *'}
        </label>
        <input
          type="text"
          value={getLocalized('displayName')}
          onChange={(e) => updateLocalized('displayName', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? 'e.g., Restaurant Menu'
              : activeLang === 'zh'
              ? '例如：餐厅菜单'
              : 'Ví dụ: Thực Đơn'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required={activeLang === 'vi'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả ({activeLang.toUpperCase()})
        </label>
        <textarea
          value={getLocalized('description')}
          onChange={(e) => updateLocalized('description', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? 'Short English description...'
              : activeLang === 'zh'
              ? '中文简短介绍...'
              : 'Mô tả ngắn về module...'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div className="border-t pt-5 space-y-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Cấu hình kỹ thuật (dùng chung)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icon (emoji hoặc class)
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ví dụ: 🍽️, 🛎️, 🗺️"
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
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
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
        {module && (
          <AdminDeleteButton
            endpoint={`/api/modules/${module.id}`}
            itemName={module.displayName}
            entityLabel="module"
            redirectTo="/admin/modules"
            variant="form"
            disabled={loading}
            className="ml-auto"
            warningNote="Xóa module sẽ tự động gỡ phân hệ này khỏi tất cả các mã QR đang gán."
          />
        )}
      </div>
    </form>
  );
}
