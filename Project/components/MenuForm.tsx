'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import AdminLanguageTabs from './AdminLanguageTabs';
import AdminDeleteButton from './AdminDeleteButton';
import {
  expandFilesWithPdfConversion,
  PdfConversionProgress,
} from '@/lib/pdf-to-images';
import {
  parseTranslations,
  resolveMenuTranslations,
  type MenuItemTranslationFields,
  type MenuTranslationFields,
  type TranslationMap,
} from '@/lib/translations';
import {
  languages,
  languageAdminLabels,
  type Language,
} from '@/lib/i18n';
import { FiGlobe } from 'react-icons/fi';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
  price: number | null;
  image: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface EditableMenuItem extends Omit<MenuItem, 'translations'> {
  translations: TranslationMap<MenuItemTranslationFields>;
}

interface Menu {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
  fileUrl: string | null;
  fileType: string | null;
  flipbookId: string | null;
  flipbook: {
    id: string;
    name: string;
    pages: string[];
  } | null;
  isActive: boolean;
  items: MenuItem[];
}

interface MenuFormProps {
  menu?: Menu;
}

function hydrateItem(item: MenuItem): EditableMenuItem {
  const parsed = parseTranslations<MenuItemTranslationFields>(item.translations);
  return {
    ...item,
    translations: {
      en: {
        name: parsed.en?.name || '',
        description: parsed.en?.description || '',
        category: parsed.en?.category || '',
      },
      zh: {
        name: parsed.zh?.name || '',
        description: parsed.zh?.description || '',
        category: parsed.zh?.category || '',
      },
    },
  };
}

export default function MenuForm({ menu }: MenuFormProps) {
  const router = useRouter();
  const resolved = resolveMenuTranslations(menu?.description, menu?.translations);

  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [itemLangs, setItemLangs] = useState<Record<string, Language>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: menu?.name || '',
    description: resolved.descriptionVi || '',
    fileUrl: menu?.fileUrl || '',
    fileType: menu?.fileType || '',
    flipbookId: menu?.flipbookId || '',
    isActive: menu?.isActive !== undefined ? menu.isActive : true,
  });

  const [translations, setTranslations] = useState<
    TranslationMap<MenuTranslationFields>
  >({
    en: {
      name: resolved.translations.en?.name || '',
      description: resolved.translations.en?.description || '',
      fileUrl: resolved.translations.en?.fileUrl || '',
      flipbookId: resolved.translations.en?.flipbookId || '',
    },
    zh: {
      name: resolved.translations.zh?.name || '',
      description: resolved.translations.zh?.description || '',
      fileUrl: resolved.translations.zh?.fileUrl || '',
      flipbookId: resolved.translations.zh?.flipbookId || '',
    },
  });

  const [flipbookFiles, setFlipbookFiles] = useState<File[]>([]);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionProgress, setConversionProgress] =
    useState<PdfConversionProgress | null>(null);
  const [availableFlipbooks, setAvailableFlipbooks] = useState<any[]>([]);
  const [showFlipbookCreator, setShowFlipbookCreator] = useState(false);
  const [creatorTargetLang, setCreatorTargetLang] = useState<Language>('vi');
  const [newFlipbookName, setNewFlipbookName] = useState('');

  useEffect(() => {
    async function loadFlipbooks() {
      try {
        const response = await fetch('/api/flipbook');
        if (response.ok) {
          const data = await response.json();
          setAvailableFlipbooks(data);
        }
      } catch (err) {
        console.error('Error loading flipbooks:', err);
      }
    }
    loadFlipbooks();
  }, []);

  const [items, setItems] = useState<EditableMenuItem[]>(
    (menu?.items || []).map(hydrateItem)
  );
  const [originalItemIds, setOriginalItemIds] = useState<Set<string>>(
    new Set(menu?.items.map((item) => item.id) || [])
  );

  useEffect(() => {
    if (menu) {
      setOriginalItemIds(new Set(menu.items.map((item) => item.id)));
    }
  }, [menu]);

  function updateMenuText(
    lang: Language,
    field: keyof MenuTranslationFields,
    value: string
  ) {
    if (lang === 'vi') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setTranslations((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] || {}),
          [field]: value,
        },
      }));
    }
  }

  function getMenuText(
    lang: Language,
    field: keyof MenuTranslationFields
  ): string {
    if (lang === 'vi') {
      return (formData as Record<string, any>)[field] || '';
    }
    return translations[lang]?.[field] || '';
  }

  const menuFilled = {
    vi: Boolean(formData.name.trim()),
    en: Boolean(
      translations.en?.name?.trim() ||
        translations.en?.description?.trim() ||
        translations.en?.fileUrl?.trim() ||
        translations.en?.flipbookId?.trim()
    ),
    zh: Boolean(
      translations.zh?.name?.trim() ||
        translations.zh?.description?.trim() ||
        translations.zh?.fileUrl?.trim() ||
        translations.zh?.flipbookId?.trim()
    ),
  };

  async function uploadMenuFile(selectedFile: File, targetLang: Language) {
    setLoading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);

      const isPDF =
        selectedFile.type === 'application/pdf' ||
        selectedFile.name.toLowerCase().endsWith('.pdf');
      const endpoint = isPDF ? '/api/upload/floor-plan' : '/api/upload/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      updateMenuText(targetLang, 'fileUrl', data.url);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`Không thể tải lên file (${targetLang.toUpperCase()})`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setActiveLang('vi');
      setError('Vui lòng nhập Tên Menu (Tiếng Việt).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = menu ? `/api/menu/${menu.id}` : '/api/menu';
      const method = menu ? 'PUT' : 'POST';

      const cleanedTranslations: TranslationMap<MenuTranslationFields> = {
        en: {
          name: translations.en?.name || '',
          description: translations.en?.description || '',
          fileUrl:
            formData.fileType === 'flipbook'
              ? ''
              : translations.en?.fileUrl || '',
          flipbookId:
            formData.fileType === 'flipbook'
              ? translations.en?.flipbookId || ''
              : '',
        },
        zh: {
          name: translations.zh?.name || '',
          description: translations.zh?.description || '',
          fileUrl:
            formData.fileType === 'flipbook'
              ? ''
              : translations.zh?.fileUrl || '',
          flipbookId:
            formData.fileType === 'flipbook'
              ? translations.zh?.flipbookId || ''
              : '',
        },
      };

      const submitData = {
        name: formData.name,
        description: formData.description?.trim() || null,
        translations: cleanedTranslations,
        isActive: formData.isActive,
        fileUrl:
          formData.fileType === 'flipbook'
            ? null
            : formData.fileUrl?.trim() || null,
        fileType: formData.fileType?.trim() || null,
        flipbookId:
          formData.fileType === 'flipbook' ? formData.flipbookId || null : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.message || data.error || 'Failed to save menu';
        console.error('Save menu error:', data);
        throw new Error(errorMessage);
      }

      router.push('/admin/menu');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        id: `new-${Date.now()}`,
        name: '',
        description: '',
        translations: {
          en: { name: '', description: '', category: '' },
          zh: { name: '', description: '', category: '' },
        },
        price: null,
        image: null,
        category: null,
        isAvailable: true,
      },
    ]);
  }

  function updateItem(
    index: number,
    field: keyof EditableMenuItem,
    value: any
  ) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  function updateItemLocalized(
    index: number,
    lang: Language,
    field: keyof MenuItemTranslationFields,
    value: string
  ) {
    const newItems = [...items];
    const target = newItems[index];
    if (lang === 'vi') {
      newItems[index] = { ...target, [field]: value };
    } else {
      newItems[index] = {
        ...target,
        translations: {
          ...target.translations,
          [lang]: {
            ...(target.translations[lang] || {}),
            [field]: value,
          },
        },
      };
    }
    setItems(newItems);
  }

  function getItemLocalized(
    item: EditableMenuItem,
    lang: Language,
    field: keyof MenuItemTranslationFields
  ): string {
    if (lang === 'vi') {
      return (item[field] as string) || '';
    }
    return item.translations[lang]?.[field] || '';
  }

  async function removeItem(index: number) {
    const itemToRemove = items[index];
    if (!itemToRemove) return;

    if (!confirm('Bạn có chắc chắn muốn xóa món này?')) {
      return;
    }

    if (!itemToRemove.id.startsWith('new-')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/menu-items/${itemToRemove.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete item');
        }

        setOriginalItemIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemToRemove.id);
          return newSet;
        });
      } catch (err: any) {
        console.error('Error deleting item:', err);
        setError(err.message || 'Không thể xóa item. Vui lòng thử lại.');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    setItems(items.filter((_, i) => i !== index));
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: fd,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Error uploading image:', err);
      return null;
    }
  }

  async function saveItems() {
    if (!menu) return;

    setLoading(true);
    setError('');
    try {
      const currentItemIds = new Set(items.map((item) => item.id));

      for (const originalId of originalItemIds) {
        if (!currentItemIds.has(originalId)) {
          try {
            await fetch(`/api/menu-items/${originalId}`, {
              method: 'DELETE',
            });
          } catch (err) {
            console.error('Error deleting removed item:', err);
          }
        }
      }

      const updatedItems = [...items];

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        const imageUrl = item.image;

        if (item.id.startsWith('new-')) {
          const response = await fetch('/api/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menuId: menu.id,
              name: item.name,
              description: item.description,
              translations: item.translations,
              price: item.price,
              category: item.category,
              image: imageUrl,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create item');
          }
          const created = await response.json();
          updatedItems[i] = hydrateItem(created);
        } else {
          const response = await fetch(`/api/menu-items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              translations: item.translations,
              price: item.price,
              category: item.category,
              image: imageUrl,
              isAvailable: item.isAvailable,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update item');
          }
        }
      }

      setItems(updatedItems);
      setOriginalItemIds(
        new Set(
          updatedItems
            .filter((item) => !item.id.startsWith('new-'))
            .map((item) => item.id)
        )
      );

      router.refresh();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save items');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 3-Language Tabs for Menu Name & Description */}
      <AdminLanguageTabs
        activeLang={activeLang}
        onChange={setActiveLang}
        filled={menuFilled}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên Menu ({languageAdminLabels[activeLang]})
            {activeLang === 'vi' && ' *'}
          </label>
          <input
            type="text"
            value={getMenuText(activeLang, 'name')}
            onChange={(e) =>
              updateMenuText(activeLang, 'name', e.target.value)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder={
              activeLang === 'en'
                ? 'e.g., Culinary & Dining Menu'
                : activeLang === 'zh'
                ? '例如：餐厅主菜单'
                : 'Ví dụ: Menu Ẩm Thực'
            }
            required={activeLang === 'vi'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả ({languageAdminLabels[activeLang]})
          </label>
          <textarea
            value={getMenuText(activeLang, 'description')}
            onChange={(e) =>
              updateMenuText(activeLang, 'description', e.target.value)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={2}
            placeholder={
              activeLang === 'en'
                ? 'English menu overview...'
                : activeLang === 'zh'
                ? '中文菜单简介...'
                : 'Mô tả ngắn về thực đơn...'
            }
          />
        </div>
      </div>

      {/* Menu Display Type & Multi-Language Files / Flipbooks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Menu Display Type
        </label>
        <select
          value={formData.fileType || 'none'}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'none') {
              setFormData({
                ...formData,
                fileType: '',
                fileUrl: '',
                flipbookId: '',
              });
              setTranslations((prev) => ({
                en: { ...(prev.en || {}), fileUrl: '', flipbookId: '' },
                zh: { ...(prev.zh || {}), fileUrl: '', flipbookId: '' },
              }));
            } else if (value === 'flipbook') {
              setFormData({
                ...formData,
                fileType: 'flipbook',
                fileUrl: '',
              });
              setTranslations((prev) => ({
                en: { ...(prev.en || {}), fileUrl: '' },
                zh: { ...(prev.zh || {}), fileUrl: '' },
              }));
            } else {
              setFormData({
                ...formData,
                fileType: value,
                flipbookId: '',
              });
              setTranslations((prev) => ({
                en: { ...(prev.en || {}), flipbookId: '' },
                zh: { ...(prev.zh || {}), flipbookId: '' },
              }));
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
        >
          <option value="none">
            Không có file (Chỉ hiển thị danh sách món)
          </option>
          <option value="pdf">PDF</option>
          <option value="image">Hình ảnh</option>
          <option value="flipbook">Flipbook</option>
        </select>

        {/* PDF / Image Upload for 3 Languages: VN, EN, ZH */}
        {(formData.fileType === 'pdf' || formData.fileType === 'image') && (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {languages.map((lang, idx) => {
              const currentUrl = getMenuText(lang, 'fileUrl');
              const isPrimary = lang === 'vi';
              return (
                <div
                  key={lang}
                  className={`p-4 rounded-xl border ${
                    isPrimary
                      ? 'border-gray-200 bg-white'
                      : 'border-[#E6D3A7] bg-[#FAF7EE]/60'
                  }`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                      isPrimary ? 'text-gray-700' : 'text-[#866526]'
                    }`}
                  >
                    {!isPrimary && <FiGlobe className="w-3.5 h-3.5" />}
                    <span>
                      {idx + 1}. {languageAdminLabels[lang]}
                      {isPrimary ? ' (Mặc định) *' : ' (Tùy chọn)'}
                    </span>
                  </p>
                  <FileUpload
                    accept={
                      formData.fileType === 'pdf'
                        ? '.pdf,application/pdf'
                        : 'image/*'
                    }
                    maxSize={20}
                    onFileSelect={async (selectedFile) => {
                      if (selectedFile) {
                        await uploadMenuFile(selectedFile, lang);
                      } else {
                        updateMenuText(lang, 'fileUrl', '');
                      }
                    }}
                    currentFileUrl={currentUrl || undefined}
                    label={`Upload ${
                      formData.fileType === 'pdf' ? 'PDF' : 'Image'
                    } (${lang.toUpperCase()})`}
                    preview={false}
                  />
                  {currentUrl && (
                    <div className="flex items-center justify-between mt-1.5 text-xs">
                      <span className="text-gray-500 truncate">
                        File {lang.toUpperCase()}:{' '}
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {currentUrl}
                        </a>
                      </span>
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => updateMenuText(lang, 'fileUrl', '')}
                          className="text-red-600 hover:underline ml-2 shrink-0"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Flipbook Selection for 3 Languages: VN, EN, ZH */}
        {formData.fileType === 'flipbook' && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {languages.map((lang, idx) => {
                const isPrimary = lang === 'vi';
                const currentFlipbookId = getMenuText(lang, 'flipbookId');
                const selectedFlipbook = availableFlipbooks.find(
                  (fb) => fb.id === currentFlipbookId
                );
                const isSelectedLocked = Boolean(
                  selectedFlipbook && !selectedFlipbook.isActive
                );
                return (
                  <div
                    key={lang}
                    className={`p-4 rounded-xl border ${
                      isSelectedLocked
                        ? 'border-red-300 bg-red-50/60'
                        : isPrimary
                        ? 'border-gray-200 bg-white'
                        : 'border-[#E6D3A7] bg-[#FAF7EE]/60'
                    }`}
                  >
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                        isSelectedLocked
                          ? 'text-red-700'
                          : isPrimary
                          ? 'text-gray-700'
                          : 'text-[#866526]'
                      }`}
                    >
                      {!isPrimary && <FiGlobe className="w-3.5 h-3.5" />}
                      <span>
                        {idx + 1}. Flipbook {languageAdminLabels[lang]}
                        {isPrimary ? ' *' : ''}
                      </span>
                    </label>
                    <select
                      value={currentFlipbookId}
                      onChange={(e) =>
                        updateMenuText(lang, 'flipbookId', e.target.value)
                      }
                      className={`w-full px-3.5 py-2 border rounded-lg text-sm bg-white ${
                        isSelectedLocked
                          ? 'border-red-300 text-red-900'
                          : isPrimary
                          ? 'border-gray-300'
                          : 'border-[#E6D3A7]'
                      }`}
                    >
                      <option value="">
                        {isPrimary
                          ? '-- Chọn flipbook Tiếng Việt --'
                          : '-- Không dùng / Tự động dự phòng --'}
                      </option>
                      {availableFlipbooks
                        .filter((fb) => fb.isActive || fb.id === currentFlipbookId)
                        .map((fb) => (
                          <option key={fb.id} value={fb.id}>
                            {!fb.isActive ? '[Tạm khóa] ' : ''}
                            {fb.name} ({fb.pages.length} trang)
                          </option>
                        ))}
                    </select>
                    {isSelectedLocked && (
                      <p className="mt-2 text-xs text-red-700 leading-relaxed">
                        Flipbook này đang bị <strong>tạm khóa</strong> nên không
                        hiển thị phía khách. Hãy mở khóa trong mục{' '}
                        <strong>Quản lý Flipbooks</strong> hoặc chọn Flipbook
                        khác.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorTargetLang(activeLang);
                    setShowFlipbookCreator(!showFlipbookCreator);
                  }}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  {showFlipbookCreator
                    ? 'Ẩn khung tạo nhanh'
                    : '+ Tạo nhanh Flipbook mới (VN / EN / ZH)'}
                </button>
              </div>

              {showFlipbookCreator && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-gray-700">
                      Gán sau khi tạo cho:
                    </span>
                    {languages.map((lang) => (
                      <label
                        key={lang}
                        className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-stone-700"
                      >
                        <input
                          type="radio"
                          checked={creatorTargetLang === lang}
                          onChange={() => setCreatorTargetLang(lang)}
                        />
                        <span>{languageAdminLabels[lang]}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên Flipbook *
                    </label>
                    <input
                      type="text"
                      value={newFlipbookName}
                      onChange={(e) => setNewFlipbookName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder={
                        creatorTargetLang === 'en'
                          ? 'Ví dụ: Dining Menu (English)'
                          : creatorTargetLang === 'zh'
                          ? 'Ví dụ: 餐厅菜单 (中文)'
                          : 'Ví dụ: Menu Nhà Hàng (Tiếng Việt)'
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files (PDF hoặc Images) *
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,application/pdf,image/*"
                      disabled={convertingPdf || loading}
                      onChange={async (e) => {
                        const selected = Array.from(e.target.files || []);
                        e.target.value = '';
                        if (selected.length === 0) return;

                        setError('');
                        setConvertingPdf(true);
                        try {
                          const expanded = await expandFilesWithPdfConversion(
                            selected,
                            (progress) => setConversionProgress(progress)
                          );
                          setFlipbookFiles((prev) => [...prev, ...expanded]);
                        } catch (err: any) {
                          console.error('Error converting PDF:', err);
                          setError(
                            err.message || 'Không thể tách trang file PDF'
                          );
                        } finally {
                          setConvertingPdf(false);
                          setConversionProgress(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Có thể chọn file PDF nhiều trang hoặc nhiều hình ảnh. Hệ
                      thống sẽ tự động tách từng trang PDF thành hình ảnh sắc
                      nét cho Flipbook.
                    </p>
                    {convertingPdf && conversionProgress && (
                      <p className="text-xs font-medium text-amber-700 mt-2">
                        Đang tách trang {conversionProgress.currentPage} /{' '}
                        {conversionProgress.totalPages} từ file &ldquo;
                        {conversionProgress.fileName}&rdquo;...
                      </p>
                    )}
                    {flipbookFiles.length > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-medium text-emerald-700">
                          Đã chuẩn bị {flipbookFiles.length} trang ảnh cho
                          Flipbook
                        </p>
                        <button
                          type="button"
                          onClick={() => setFlipbookFiles([])}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Xóa danh sách
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newFlipbookName || flipbookFiles.length === 0) {
                        setError('Vui lòng nhập tên và chọn ít nhất một file');
                        return;
                      }

                      setLoading(true);
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('name', newFlipbookName);
                        flipbookFiles.forEach((f) => {
                          formDataUpload.append('files', f);
                        });

                        const response = await fetch('/api/flipbook/create', {
                          method: 'POST',
                          body: formDataUpload,
                        });

                        if (!response.ok) {
                          const data = await response.json();
                          throw new Error(
                            data.error || 'Failed to create flipbook'
                          );
                        }

                        const flipbook = await response.json();
                        updateMenuText(
                          creatorTargetLang,
                          'flipbookId',
                          flipbook.id
                        );
                        setAvailableFlipbooks([
                          ...availableFlipbooks,
                          flipbook,
                        ]);
                        setNewFlipbookName('');
                        setFlipbookFiles([]);
                        setShowFlipbookCreator(false);
                        setError('');
                      } catch (err: any) {
                        setError(err.message || 'Failed to create flipbook');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={
                      loading ||
                      convertingPdf ||
                      !newFlipbookName ||
                      flipbookFiles.length === 0
                    }
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {convertingPdf
                      ? 'Đang tách trang PDF...'
                      : `Tạo & Gán vào bản ${languageAdminLabels[creatorTargetLang]}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Menu Items Section with 3-Language Support */}
      {menu && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Danh sách món ăn (Menu Items)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Mỗi món hỗ trợ dịch Tên, Mô tả và Danh mục sang VN / EN / ZH
              </p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              + Thêm Món
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const curLang = itemLangs[item.id] || 'vi';
              const itemFilled = {
                vi: Boolean(item.name.trim()),
                en: Boolean(
                  item.translations.en?.name?.trim() ||
                    item.translations.en?.description?.trim() ||
                    item.translations.en?.category?.trim()
                ),
                zh: Boolean(
                  item.translations.zh?.name?.trim() ||
                    item.translations.zh?.description?.trim() ||
                    item.translations.zh?.category?.trim()
                ),
              };

              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                      Món #{index + 1} {item.name ? `· ${item.name}` : ''}
                    </span>
                    <AdminLanguageTabs
                      compact
                      activeLang={curLang}
                      onChange={(lang) =>
                        setItemLangs((prev) => ({ ...prev, [item.id]: lang }))
                      }
                      filled={itemFilled}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên món ({curLang.toUpperCase()})
                        {curLang === 'vi' && ' *'}
                      </label>
                      <input
                        type="text"
                        value={getItemLocalized(item, curLang, 'name')}
                        onChange={(e) =>
                          updateItemLocalized(
                            index,
                            curLang,
                            'name',
                            e.target.value
                          )
                        }
                        placeholder={
                          curLang === 'en'
                            ? item.name || 'English dish name'
                            : curLang === 'zh'
                            ? item.name || '中文菜名'
                            : 'Tên món Tiếng Việt'
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                        required={curLang === 'vi'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VND - dùng chung)
                      </label>
                      <input
                        type="number"
                        value={item.price ?? ''}
                        onChange={(e) =>
                          updateItem(
                            index,
                            'price',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả ({curLang.toUpperCase()})
                    </label>
                    <textarea
                      value={getItemLocalized(item, curLang, 'description')}
                      onChange={(e) =>
                        updateItemLocalized(
                          index,
                          curLang,
                          'description',
                          e.target.value
                        )
                      }
                      placeholder={
                        curLang === 'en'
                          ? 'English dish description...'
                          : curLang === 'zh'
                          ? '中文菜品介绍...'
                          : 'Mô tả món ăn...'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Danh mục ({curLang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={getItemLocalized(item, curLang, 'category')}
                        onChange={(e) =>
                          updateItemLocalized(
                            index,
                            curLang,
                            'category',
                            e.target.value
                          )
                        }
                        placeholder={
                          curLang === 'en'
                            ? 'Appetizer, Main Course, Dessert...'
                            : curLang === 'zh'
                            ? '开胃菜、主菜、甜点...'
                            : 'Khai vị, Món chính, Tráng miệng...'
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <FileUpload
                      accept="image/*"
                      maxSize={5}
                      onFileSelect={async (f) => {
                        if (f) {
                          setLoading(true);
                          try {
                            const url = await uploadImage(f);
                            if (url) {
                              updateItem(index, 'image', url);
                            } else {
                              setError('Failed to upload image');
                            }
                          } catch {
                            setError('Failed to upload image');
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          updateItem(index, 'image', null);
                        }
                      }}
                      currentFileUrl={item.image || undefined}
                      label="Hình ảnh món"
                      preview={true}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Xóa Món
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={saveItems}
              disabled={loading}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Đang lưu...' : 'Lưu Danh Sách Món'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu Menu'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Hủy
        </button>
        {menu && (
          <AdminDeleteButton
            endpoint={`/api/menu/${menu.id}`}
            itemName={menu.name}
            entityLabel="thực đơn"
            redirectTo="/admin/menu"
            variant="form"
            disabled={loading}
            className="ml-auto"
            warningNote={
              items.length > 0
                ? `Tất cả ${items.length} món ăn thuộc thực đơn này cũng sẽ bị xóa vĩnh viễn.`
                : undefined
            }
          />
        )}
      </div>
    </form>
  );
}
