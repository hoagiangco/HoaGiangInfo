'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiGlobe } from 'react-icons/fi';
import CKEditorComponent from './CKEditor';
import FileUpload from './FileUpload';
import AdminLanguageTabs from './AdminLanguageTabs';
import AdminDeleteButton from './AdminDeleteButton';
import {
  expandFilesWithPdfConversion,
  PdfConversionProgress,
} from '@/lib/pdf-to-images';
import {
  languages,
  languageAdminLabels,
  type Language,
} from '@/lib/i18n';
import {
  parseTranslations,
  type InformationTranslationFields,
  type TranslationMap,
} from '@/lib/translations';

interface Information {
  id: string;
  category: string;
  title: string;
  content: string;
  translations?: unknown;
  fileUrl?: string | null;
  fileType?: string | null;
  flipbookId?: string | null;
  flipbook?: {
    id: string;
    name: string;
    pages: string[];
  } | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

interface InformationFormProps {
  information?: Information;
}

function ContentEditor({
  editorKey,
  value,
  onChange,
  placeholder,
}: {
  editorKey: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="ckeditor-wrapper" style={{ minHeight: '300px' }}>
      <CKEditorComponent
        key={editorKey}
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Nhập nội dung...'}
      />
    </div>
  );
}

const INFO_CATEGORIES = [
  { value: 'wifi', label: 'WiFi & Internet' },
  { value: 'phone', label: 'Điện thoại nội bộ (Phone)' },
  { value: 'tv', label: 'Kênh truyền hình (TV Channels)' },
  { value: 'room-info', label: 'Thông tin phòng (Room Info)' },
  { value: 'guide', label: 'Cẩm nang & Hướng dẫn (Guide)' },
  { value: 'safety', label: 'An ninh & An toàn (Safety)' },
];

export default function InformationForm({ information }: InformationFormProps) {
  const router = useRouter();
  const initialTranslations = parseTranslations<InformationTranslationFields>(
    information?.translations
  );

  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    category: information?.category || 'wifi',
    title: information?.title || '',
    content: information?.content || '',
    fileUrl: information?.fileUrl || '',
    fileType: information?.fileType || '',
    flipbookId: information?.flipbookId || '',
    icon: information?.icon || '',
    order: information?.order || 0,
    isActive: information?.isActive !== undefined ? information.isActive : true,
  });

  const [translations, setTranslations] = useState<
    TranslationMap<InformationTranslationFields>
  >({
    en: {
      title: initialTranslations.en?.title || '',
      content: initialTranslations.en?.content || '',
      fileUrl: initialTranslations.en?.fileUrl || '',
      flipbookId: initialTranslations.en?.flipbookId || '',
    },
    zh: {
      title: initialTranslations.zh?.title || '',
      content: initialTranslations.zh?.content || '',
      fileUrl: initialTranslations.zh?.fileUrl || '',
      flipbookId: initialTranslations.zh?.flipbookId || '',
    },
  });

  const [availableFlipbooks, setAvailableFlipbooks] = useState<any[]>([]);
  const [showFlipbookCreator, setShowFlipbookCreator] = useState(false);
  const [creatorTargetLang, setCreatorTargetLang] = useState<Language>('vi');
  const [newFlipbookName, setNewFlipbookName] = useState('');
  const [flipbookFiles, setFlipbookFiles] = useState<File[]>([]);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionProgress, setConversionProgress] =
    useState<PdfConversionProgress | null>(null);

  useEffect(() => {
    setMounted(true);
    async function loadFlipbooks() {
      try {
        const res = await fetch('/api/flipbook');
        if (res.ok) {
          setAvailableFlipbooks(await res.json());
        }
      } catch (err) {
        console.error('Error loading flipbooks:', err);
      }
    }
    loadFlipbooks();
  }, []);

  function updateField(
    lang: Language,
    field: keyof InformationTranslationFields,
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

  function getField(
    lang: Language,
    field: keyof InformationTranslationFields
  ): string {
    if (lang === 'vi') {
      return (formData as Record<string, any>)[field] || '';
    }
    return translations[lang]?.[field] || '';
  }

  const currentTitle = getField(activeLang, 'title');
  const currentContent = getField(activeLang, 'content');

  const filled = {
    vi: Boolean(formData.title.trim()),
    en: Boolean(
      translations.en?.title?.trim() ||
        translations.en?.content?.trim() ||
        translations.en?.fileUrl?.trim() ||
        translations.en?.flipbookId?.trim()
    ),
    zh: Boolean(
      translations.zh?.title?.trim() ||
        translations.zh?.content?.trim() ||
        translations.zh?.fileUrl?.trim() ||
        translations.zh?.flipbookId?.trim()
    ),
  };

  async function uploadInfoFile(selectedFile: File, targetLang: Language) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);

      const isPDF =
        selectedFile.type === 'application/pdf' ||
        selectedFile.name.toLowerCase().endsWith('.pdf');
      const endpoint = isPDF ? '/api/upload/floor-plan' : '/api/upload/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: fd,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      updateField(targetLang, 'fileUrl', data.url);
    } catch (err) {
      console.error('Error uploading information file:', err);
      setError(`Không thể tải lên file (${targetLang.toUpperCase()})`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      setActiveLang('vi');
      setError('Vui lòng nhập Tiêu đề bằng Tiếng Việt (mặc định).');
      return;
    }

    const hasAttachment = Boolean(
      formData.fileUrl ||
        formData.flipbookId ||
        translations.en?.fileUrl ||
        translations.en?.flipbookId ||
        translations.zh?.fileUrl ||
        translations.zh?.flipbookId
    );
    const plainContent = formData.content
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, '')
      .trim();

    if (!plainContent && !hasAttachment) {
      setActiveLang('vi');
      setError(
        'Vui lòng nhập Nội dung hoặc đính kèm tài liệu (PDF / Hình ảnh / Flipbook).'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = information
        ? `/api/information/${information.id}`
        : '/api/information';
      const method = information ? 'PUT' : 'POST';

      const cleanedTranslations: TranslationMap<InformationTranslationFields> = {
        en: {
          title: translations.en?.title || '',
          content: translations.en?.content || '',
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
          title: translations.zh?.title || '',
          content: translations.zh?.content || '',
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          title: formData.title,
          content: formData.content || '',
          translations: cleanedTranslations,
          fileType: formData.fileType?.trim() || null,
          fileUrl:
            formData.fileType === 'flipbook'
              ? null
              : formData.fileUrl?.trim() || null,
          flipbookId:
            formData.fileType === 'flipbook'
              ? formData.flipbookId || null
              : null,
          icon: formData.icon,
          order: formData.order,
          isActive: formData.isActive,
        }),
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

  const hasCustomCategory =
    formData.category &&
    !INFO_CATEGORIES.some((c) => c.value === formData.category);

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
          Tiêu đề ({languageAdminLabels[activeLang]})
          {activeLang === 'vi' && ' *'}
        </label>
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => updateField(activeLang, 'title', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? formData.title || 'e.g., Wi-Fi Password / SCTV Channel List'
              : activeLang === 'zh'
              ? formData.title || '例如：Wi-Fi 密码 / 电视频道列表'
              : 'Ví dụ: Mật khẩu WiFi / Danh sách kênh SCTV'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required={activeLang === 'vi'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nội dung văn bản / Bảng biểu ({languageAdminLabels[activeLang]})
        </label>
        {mounted ? (
          <ContentEditor
            editorKey={`info-editor-${activeLang}`}
            value={currentContent}
            onChange={(value) => updateField(activeLang, 'content', value)}
            placeholder={
              activeLang === 'en'
                ? 'Enter English content (optional if attaching PDF/Flipbook)...'
                : activeLang === 'zh'
                ? '请输入中文内容（如已上传 PDF/翻页书可留空）...'
                : 'Nhập nội dung hoặc dán bảng (có thể để trống nếu chỉ hiển thị PDF / Hình ảnh / Flipbook)...'
            }
          />
        ) : (
          <textarea
            value={currentContent}
            onChange={(e) => updateField(activeLang, 'content', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={6}
            placeholder="Đang tải editor..."
            disabled
          />
        )}
        <p className="text-xs text-gray-500 mt-1.5">
          Gợi ý: Mục ngắn (WiFi, Điện thoại, Giờ nhận/trả phòng) sẽ tự động hiển
          thị dạng thẻ xem nhanh. Mục có bảng biểu dài hoặc đính kèm
          PDF/Ảnh/Flipbook sẽ hiển thị gọn và mở trang chi tiết toàn màn hình
          giống Thực Đơn.
        </p>
      </div>

      {/* Document / Flipbook Attachment Section (3 Languages: VN / EN / ZH) */}
      <div className="border-t pt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tài liệu đính kèm (Tùy chọn — giống Thực Đơn)
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="none">
              Không có file (Chỉ hiển thị nội dung soạn thảo)
            </option>
            <option value="pdf">PDF</option>
            <option value="image">Hình ảnh</option>
            <option value="flipbook">Flipbook</option>
          </select>
        </div>

        {/* PDF / Image Uploads for VN / EN / ZH */}
        {(formData.fileType === 'pdf' || formData.fileType === 'image') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {languages.map((lang, idx) => {
              const currentUrl = getField(lang, 'fileUrl');
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
                      {isPrimary ? ' (Mặc định)' : ' (Tùy chọn)'}
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
                        await uploadInfoFile(selectedFile, lang);
                      } else {
                        updateField(lang, 'fileUrl', '');
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
                          onClick={() => updateField(lang, 'fileUrl', '')}
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

        {/* Flipbook Selector for VN / EN / ZH + Quick Creator */}
        {formData.fileType === 'flipbook' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {languages.map((lang, idx) => {
                const isPrimary = lang === 'vi';
                const currentFlipbookId = getField(lang, 'flipbookId');
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
                      </span>
                    </label>
                    <select
                      value={currentFlipbookId}
                      onChange={(e) =>
                        updateField(lang, 'flipbookId', e.target.value)
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
                      placeholder="Ví dụ: Cẩm nang lưu trú (VN / EN / ZH)"
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
                        const fd = new FormData();
                        fd.append('name', newFlipbookName);
                        flipbookFiles.forEach((f) => fd.append('files', f));

                        const res = await fetch('/api/flipbook/create', {
                          method: 'POST',
                          body: fd,
                        });
                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(
                            data.error || 'Failed to create flipbook'
                          );
                        }
                        const flipbook = await res.json();
                        updateField(
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

      {/* Shared Configuration */}
      <div className="border-t pt-6 space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Cấu hình chung (dùng cho mọi ngôn ngữ)
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chuyên mục (Category) *
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {INFO_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
            {hasCustomCategory && (
              <option value={formData.category}>{formData.category}</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon (Emoji)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="📶"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thứ tự hiển thị (Order)
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
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
          {loading ? 'Đang lưu...' : 'Lưu Thông Tin'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Hủy
        </button>
        {information && (
          <AdminDeleteButton
            endpoint={`/api/information/${information.id}`}
            itemName={information.title}
            entityLabel="mục thông tin"
            redirectTo="/admin/information"
            variant="form"
            disabled={loading}
            className="ml-auto"
          />
        )}
      </div>
    </form>
  );
}
