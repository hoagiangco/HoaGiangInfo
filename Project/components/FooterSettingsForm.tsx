'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiEye,
  FiEyeOff,
  FiRotateCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiPhoneCall,
  FiLayout,
  FiCopy,
  FiUpload,
  FiImage,
  FiX,
} from 'react-icons/fi';
import AdminLanguageTabs from './AdminLanguageTabs';
import GuestFooter from './GuestFooter';
import WelcomePopup from './WelcomePopup';
import { FooterIcon } from './ConciergeBar';
import { BrandLogoMark } from './Navigation';
import { languageShortLabels, type Language } from '@/lib/i18n';
import { getCurrentYearVN } from '@/lib/locale';
import {
  DEFAULT_FOOTER_CONFIG,
  FOOTER_ICON_KEYS,
  FOOTER_ICON_LABELS,
  resolveLocalizedText,
  type ConciergeBadgeItem,
  type FooterConfig,
  type FooterIconKey,
  type LocalizedText,
  type LogoFrameStyle,
  type PopupFrequency,
} from '@/lib/footer-config';

interface FooterSettingsFormProps {
  initialConfig: FooterConfig;
}

function cloneConfig(cfg: FooterConfig): FooterConfig {
  return JSON.parse(JSON.stringify(cfg));
}

function createEmptyItem(): ConciergeBadgeItem {
  return {
    id: `concierge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    icon: 'phone',
    label: { vi: '', en: '', zh: '' },
    highlight: { vi: '', en: '', zh: '' },
    suffix: { vi: '', en: '', zh: '' },
    href: '',
    isActive: true,
  };
}

export default function FooterSettingsForm({
  initialConfig,
}: FooterSettingsFormProps) {
  const router = useRouter();
  const [config, setConfig] = useState<FooterConfig>(() =>
    cloneConfig(initialConfig)
  );
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(initialConfig)
  );
  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPopupImg, setUploadingPopupImg] = useState(false);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const popupImgInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(config) !== savedSnapshot,
    [config, savedSnapshot]
  );

  const filledLangs = useMemo(() => {
    const checkLang = (lang: Language) => {
      const hasConcierge = Boolean(
        config.concierge.title[lang]?.trim() ||
          config.concierge.subtitle[lang]?.trim() ||
          config.concierge.items.some(
            (i) =>
              i.label[lang]?.trim() ||
              i.highlight?.[lang]?.trim() ||
              i.suffix?.[lang]?.trim()
          )
      );
      const hasBrand = Boolean(
        config.branding.brandSubtitle[lang]?.trim() ||
          config.brandFooter.resortName[lang]?.trim() ||
          config.brandFooter.welcomeText[lang]?.trim() ||
          config.brandFooter.copyrightText[lang]?.trim() ||
          config.brandFooter.address[lang]?.trim()
      );
      return hasConcierge || hasBrand;
    };

    return {
      vi: checkLang('vi'),
      en: checkLang('en'),
      zh: checkLang('zh'),
    };
  }, [config]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      setStatus({
        type: 'error',
        text: 'Vui lòng chọn file ảnh PNG, WebP hoặc JPG (khuyến nghị PNG nền trong suốt).',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        type: 'error',
        text: 'Dung lượng ảnh logo phải nhỏ hơn 5MB.',
      });
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'logo');

      const res = await fetch('/api/upload/image?purpose=logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Không thể tải ảnh logo lên');
      }

      setConfig((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          logoUrl: data.url,
        },
      }));
      setStatus({
        type: 'success',
        text: 'Đã tải ảnh logo lên thành công! Hãy bấm "Lưu Cấu Hình" bên dưới để áp dụng ngay lên trang khách.',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err.message || 'Lỗi khi tải ảnh logo',
      });
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  function updateBrandingSubtitle(value: string) {
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        brandSubtitle: {
          ...prev.branding.brandSubtitle,
          [activeLang]: value,
        },
      },
    }));
  }

  function updateWelcomePopupText(
    field: 'badge' | 'title' | 'message' | 'ctaLabel',
    value: string
  ) {
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      welcomePopup: {
        ...prev.welcomePopup,
        [field]: {
          ...prev.welcomePopup[field],
          [activeLang]: value,
        },
      },
    }));
  }

  async function handlePopupImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      setStatus({
        type: 'error',
        text: 'Vui lòng chọn file ảnh PNG, WebP hoặc JPG.',
      });
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus({
        type: 'error',
        text: 'Dung lượng ảnh bìa popup phải nhỏ hơn 5MB.',
      });
      e.target.value = '';
      return;
    }

    setUploadingPopupImg(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Không thể tải ảnh bìa popup lên');
      }

      setConfig((prev) => ({
        ...prev,
        welcomePopup: {
          ...prev.welcomePopup,
          imageUrl: data.url,
        },
      }));
      setStatus({
        type: 'success',
        text: 'Đã tải ảnh bìa Popup lên! Bấm "Xem thử Popup" hoặc "Lưu Cấu Hình" để áp dụng.',
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err.message || 'Lỗi khi tải ảnh bìa popup',
      });
    } finally {
      setUploadingPopupImg(false);
      e.target.value = '';
    }
  }

  function updateConciergeText(field: 'title' | 'subtitle', value: string) {
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      concierge: {
        ...prev.concierge,
        [field]: {
          ...prev.concierge[field],
          [activeLang]: value,
        },
      },
    }));
  }

  function updateBrandText(
    field: 'resortName' | 'welcomeText' | 'copyrightText' | 'address',
    value: string
  ) {
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      brandFooter: {
        ...prev.brandFooter,
        [field]: {
          ...prev.brandFooter[field],
          [activeLang]: value,
        },
      },
    }));
  }

  function updateItem(
    index: number,
    updater: (item: ConciergeBadgeItem) => ConciergeBadgeItem
  ) {
    setStatus(null);
    setConfig((prev) => {
      const nextItems = [...prev.concierge.items];
      nextItems[index] = updater(nextItems[index]);
      return {
        ...prev,
        concierge: {
          ...prev.concierge,
          items: nextItems,
        },
      };
    });
  }

  function updateItemLocalized(
    index: number,
    field: 'label' | 'highlight' | 'suffix',
    value: string
  ) {
    updateItem(index, (item) => {
      const current: LocalizedText = item[field] ?? { vi: '', en: '', zh: '' };
      return {
        ...item,
        [field]: {
          ...current,
          [activeLang]: value,
        },
      };
    });
  }

  function copyViToCurrentLangForItem(index: number) {
    if (activeLang === 'vi') return;
    updateItem(index, (item) => ({
      ...item,
      label: { ...item.label, [activeLang]: item.label.vi },
      highlight: {
        ...(item.highlight ?? { vi: '', en: '', zh: '' }),
        [activeLang]: item.highlight?.vi ?? '',
      },
      suffix: {
        ...(item.suffix ?? { vi: '', en: '', zh: '' }),
        [activeLang]: item.suffix?.vi ?? '',
      },
    }));
  }

  function addItem() {
    if (config.concierge.items.length >= 12) return;
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      concierge: {
        ...prev.concierge,
        items: [...prev.concierge.items, createEmptyItem()],
      },
    }));
  }

  function removeItem(index: number) {
    setStatus(null);
    setConfig((prev) => ({
      ...prev,
      concierge: {
        ...prev.concierge,
        items: prev.concierge.items.filter((_, i) => i !== index),
      },
    }));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= config.concierge.items.length) return;
    setStatus(null);
    setConfig((prev) => {
      const next = [...prev.concierge.items];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return {
        ...prev,
        concierge: {
          ...prev.concierge,
          items: next,
        },
      };
    });
  }

  function handleResetDefaults() {
    if (
      !confirm(
        'Khôi phục toàn bộ nội dung Footer & Thanh hỗ trợ về giá trị mặc định ban đầu? (Bạn vẫn cần bấm Lưu để áp dụng)'
      )
    ) {
      return;
    }
    setConfig(cloneConfig(DEFAULT_FOOTER_CONFIG));
    setStatus({
      type: 'success',
      text: 'Đã nạp lại nội dung mặc định. Bấm "Lưu Cấu Hình Footer" để cập nhật lên trang khách.',
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Quick client check: every item must have at least one VI text part
    const emptyIdx = config.concierge.items.findIndex(
      (i) =>
        !i.label.vi.trim() &&
        !(i.highlight?.vi ?? '').trim() &&
        !(i.suffix?.vi ?? '').trim()
    );
    if (emptyIdx !== -1) {
      setActiveLang('vi');
      setStatus({
        type: 'error',
        text: `Mục hỗ trợ #${emptyIdx + 1} chưa có nội dung Tiếng Việt. Vui lòng nhập nội dung hoặc xóa mục trống.`,
      });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu cấu hình footer');
      }

      setConfig(cloneConfig(data));
      setSavedSnapshot(JSON.stringify(data));
      setStatus({
        type: 'success',
        text: 'Đã lưu cấu hình Footer & Thanh hỗ trợ thành công! Thay đổi đã hiển thị ngay trên trang khách.',
      });
      router.refresh();
    } catch (err: any) {
      setStatus({
        type: 'error',
        text: err.message || 'Có lỗi xảy ra khi lưu cấu hình footer',
      });
    } finally {
      setSaving(false);
    }
  }

  const langTag = languageShortLabels[activeLang];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Status Banner */}
      {status && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${
            status.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {status.type === 'success' ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <FiAlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <p className="text-sm font-medium">{status.text}</p>
        </div>
      )}

      {/* Language Tabs */}
      <AdminLanguageTabs
        activeLang={activeLang}
        onChange={setActiveLang}
        filled={filledLangs}
      />

      {/* Live Preview Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-serif text-base font-bold text-slate-900">
              Xem Trước Giao Diện Khách ({langTag})
            </h2>
            {hasUnsavedChanges && (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Chưa lưu thay đổi
              </span>
            )}
          </div>
          <Link
            href="/guest"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#866526] hover:text-[#684B1B]"
          >
            <span>Mở trang khách thực tế</span>
            <FiExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-5 sm:p-6 bg-[#F3EFE6] space-y-5">
          {/* Header Branding Live Preview */}
          <div className="bg-white rounded-2xl border border-[#D5C9B2] px-4 py-3 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandLogoMark
                logoUrl={config.branding.logoUrl}
                logoFrame={config.branding.logoFrame}
                alt={config.branding.brandTitle || 'HOA GIANG'}
                size="preview"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-serif text-base font-bold tracking-[0.12em] text-slate-900 leading-tight truncate">
                  {config.branding.brandTitle || 'HOA GIANG'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.1em] text-[#6E4E12] font-extrabold leading-tight truncate">
                  {resolveLocalizedText(
                    activeLang,
                    config.branding.brandSubtitle,
                    'Hòa Bình Rạch Giá Resort'
                  )}
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-[#F3EFE6] border border-[#CFC3AC] px-2.5 py-1 rounded-full shrink-0">
              Header ({langTag})
            </span>
          </div>

          {!config.concierge.enabled && !config.brandFooter.enabled ? (
            <div className="py-10 text-center text-xs text-stone-400 border border-dashed border-[#E6D3A7] rounded-2xl">
              Cả Thanh Hỗ Trợ Trực Tiếp và Chân Trang Thương Hiệu đều đang tắt hiển thị.
            </div>
          ) : (
            <GuestFooter
              config={config}
              languageOverride={activeLang}
              isPreview
            />
          )}
        </div>
      </div>

      {/* SECTION 0: Header Logo & Resort Branding */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
            <FiImage className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">
              1. Logo & Thương Hiệu Đầu Trang (Header)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự tải ảnh Logo của resort (hỗ trợ PNG nền trong suốt, WebP, JPG) và chỉnh tên hiển thị cạnh logo
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo Uploader + Frame Style */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Ảnh Logo Resort (dùng chung mọi ngôn ngữ)
              </label>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
                <div className="w-16 h-16 rounded-2xl bg-[repeating-conic-gradient(#e2e8f0_0%_25%,#ffffff_0%_50%)] [background-size:12px_12px] border border-slate-300 flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
                  <BrandLogoMark
                    logoUrl={config.branding.logoUrl}
                    logoFrame={config.branding.logoFrame}
                    alt={config.branding.brandTitle || 'Logo'}
                    size="preview"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A] text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                      <FiUpload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingLogo
                          ? 'Đang tải logo...'
                          : config.branding.logoUrl
                          ? 'Thay đổi Logo'
                          : 'Tải lên Logo'}
                      </span>
                    </button>

                    {config.branding.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatus(null);
                          setConfig((prev) => ({
                            ...prev,
                            branding: { ...prev.branding, logoUrl: '' },
                          }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold transition-all"
                      >
                        <FiX className="w-3.5 h-3.5" />
                        <span>Xóa logo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Khuyến nghị: ảnh <strong>PNG nền trong suốt</strong> (tỷ lệ vuông hoặc ngang gọn), dung lượng tối đa 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Kiểu khung nền Logo
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'none', label: 'Không khung', desc: 'Tự nhiên' },
                    { key: 'light', label: 'Nền trắng', desc: 'Logo chữ tối' },
                    { key: 'dark', label: 'Nền Navy đậm', desc: 'Logo vàng/trắng' },
                  ] as Array<{ key: LogoFrameStyle; label: string; desc: string }>
                ).map((opt) => {
                  const active = config.branding.logoFrame === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setStatus(null);
                        setConfig((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, logoFrame: opt.key },
                        }));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className={`block text-xs font-bold ${
                          active ? 'text-[#E8CA7A]' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span
                        className={`block text-[10.5px] mt-0.5 ${
                          active ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Brand Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên thương hiệu dòng trên (dùng chung)
              </label>
              <input
                type="text"
                value={config.branding.brandTitle}
                onChange={(e) => {
                  setStatus(null);
                  setConfig((prev) => ({
                    ...prev,
                    branding: { ...prev.branding, brandTitle: e.target.value },
                  }));
                }}
                placeholder="HOA GIANG"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên resort dòng dưới ({langTag})
              </label>
              <input
                type="text"
                value={config.branding.brandSubtitle[activeLang] ?? ''}
                onChange={(e) => updateBrandingSubtitle(e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Hòa Bình Rạch Giá Resort'
                    : config.branding.brandSubtitle.vi || 'Hoa Binh Rach Gia Resort'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: QR Arrival Welcome Popup */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
              <FiEye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                2. Popup Chào Mừng Khi Quét QR (Welcome Popup)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị lời chào mừng sang trọng ngay khi khách vừa quét mã QR vào trang chủ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPreviewPopupOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A] text-xs font-bold shadow-sm transition-all"
            >
              <FiEye className="w-3.5 h-3.5" />
              <span>Xem thử Popup ({langTag})</span>
            </button>

            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={config.welcomePopup.enabled}
                onChange={(e) => {
                  setStatus(null);
                  setConfig((prev) => ({
                    ...prev,
                    welcomePopup: {
                      ...prev.welcomePopup,
                      enabled: e.target.checked,
                    },
                  }));
                }}
                className="w-4 h-4 rounded accent-[#866526]"
              />
              <span className="text-xs font-semibold text-slate-700">
                {config.welcomePopup.enabled ? 'Đang bật' : 'Đang tắt'}
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Frequency + Quick Feature Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tần suất hiển thị (dùng chung)
              </label>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                {(
                  [
                    { key: 'session', label: '1 lần / phiên quét QR (Khuyên dùng)' },
                    { key: 'always', label: 'Mỗi lần vào trang chủ' },
                  ] as Array<{ key: PopupFrequency; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setStatus(null);
                      setConfig((prev) => ({
                        ...prev,
                        welcomePopup: {
                          ...prev.welcomePopup,
                          frequency: opt.key,
                        },
                      }));
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      config.welcomePopup.frequency === opt.key
                        ? 'bg-white text-[#866526] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Chế độ &quot;1 lần / phiên&quot; giúp chào đón khách ngay khi quét QR nhưng không bật lại gây phiền khi khách quay về trang chủ từ Thực đơn/Dịch vụ.
              </p>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tiện ích đính kèm trong Popup
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={config.welcomePopup.showLanguagePicker}
                  onChange={(e) => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      welcomePopup: {
                        ...prev.welcomePopup,
                        showLanguagePicker: e.target.checked,
                      },
                    }));
                  }}
                  className="w-4 h-4 rounded accent-[#866526]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Cho khách chọn nhanh ngôn ngữ (Tiếng Việt / English / 中文) ngay trong Popup
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={config.welcomePopup.showWifiQuickCopy}
                  onChange={(e) => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      welcomePopup: {
                        ...prev.welcomePopup,
                        showWifiQuickCopy: e.target.checked,
                      },
                    }));
                  }}
                  className="w-4 h-4 rounded accent-[#866526]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Hiển thị dòng sao chép nhanh mật khẩu Wi-Fi ngay trong Popup
                </span>
              </label>
            </div>
          </div>

          {/* Optional Popup Banner Photo */}
          <div className="space-y-2.5 pb-6 border-b border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Ảnh bìa Popup (tùy chọn — để trống sẽ hiển thị khung Navy 4 sao + Logo sang trọng)
            </label>
            <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              {config.welcomePopup.imageUrl ? (
                <div className="w-32 h-20 rounded-xl overflow-hidden border border-slate-300 bg-slate-200 shrink-0">
                  <img
                    src={config.welcomePopup.imageUrl}
                    alt="Popup cover"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-20 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 text-[11px] font-medium shrink-0">
                  Chưa có ảnh bìa
                </div>
              )}

              <div className="flex-1 min-w-[200px] space-y-2">
                <input
                  ref={popupImgInputRef}
                  type="file"
                  accept="image/png,image/webp,image/jpeg,image/jpg"
                  onChange={handlePopupImageUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={uploadingPopupImg}
                    onClick={() => popupImgInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    <FiUpload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingPopupImg
                        ? 'Đang tải ảnh...'
                        : config.welcomePopup.imageUrl
                        ? 'Đổi ảnh bìa'
                        : 'Tải ảnh bìa resort'}
                    </span>
                  </button>

                  {config.welcomePopup.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatus(null);
                        setConfig((prev) => ({
                          ...prev,
                          welcomePopup: { ...prev.welcomePopup, imageUrl: '' },
                        }));
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold transition-all"
                    >
                      <FiX className="w-3.5 h-3.5" />
                      <span>Gỡ ảnh bìa</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Khuyến nghị ảnh ngang tỷ lệ 16:9 (sảnh resort, hồ bơi hoặc cảnh biển Rạch Giá), tối đa 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Multilingual Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nhãn trên ({langTag})
              </label>
              <input
                type="text"
                value={config.welcomePopup.badge[activeLang] ?? ''}
                onChange={(e) => updateWelcomePopupText('badge', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'CHÀO MỪNG QUÝ KHÁCH'
                    : config.welcomePopup.badge.vi
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tiêu đề chính ({langTag})
              </label>
              <input
                type="text"
                value={config.welcomePopup.title[activeLang] ?? ''}
                onChange={(e) => updateWelcomePopupText('title', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Hòa Bình Rạch Giá Resort'
                    : config.welcomePopup.title.vi
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nút bắt đầu ({langTag})
              </label>
              <input
                type="text"
                value={config.welcomePopup.ctaLabel[activeLang] ?? ''}
                onChange={(e) => updateWelcomePopupText('ctaLabel', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Khám Phá Ngay'
                    : config.welcomePopup.ctaLabel.vi
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Lời chào mừng chi tiết ({langTag})
            </label>
            <textarea
              rows={3}
              value={config.welcomePopup.message[activeLang] ?? ''}
              onChange={(e) => updateWelcomePopupText('message', e.target.value)}
              placeholder={
                activeLang === 'vi'
                  ? 'Kính chúc Quý khách có những phút giây nghỉ dưỡng thật thư thái...'
                  : config.welcomePopup.message.vi
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Quick Concierge & Assistance Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
              <FiPhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                3. Thanh Hỗ Trợ Trực Tiếp (Concierge Bar)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Khối màu vàng kem phía trên chân trang với tiêu đề, mô tả và các thẻ thông tin hỗ trợ nhanh
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={config.concierge.enabled}
              onChange={(e) => {
                setStatus(null);
                setConfig((prev) => ({
                  ...prev,
                  concierge: { ...prev.concierge, enabled: e.target.checked },
                }));
              }}
              className="w-4 h-4 rounded accent-[#866526]"
            />
            <span className="text-xs font-semibold text-slate-700">
              {config.concierge.enabled ? 'Đang hiển thị' : 'Đang ẩn'}
            </span>
          </label>
        </div>

        <div className="p-6 space-y-6">
          {/* Display scope + Main icon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Phạm vi hiển thị (dùng chung)
              </label>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      concierge: { ...prev.concierge, showOnAllPages: false },
                    }));
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    !config.concierge.showOnAllPages
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chỉ Trang Chủ QR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      concierge: { ...prev.concierge, showOnAllPages: true },
                    }));
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    config.concierge.showOnAllPages
                      ? 'bg-white text-[#866526] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất Cả Trang Khách
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Chọn &quot;Tất Cả Trang Khách&quot; nếu muốn thanh hỗ trợ xuất hiện ở cả Thực đơn, Dịch vụ, Thông tin...
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Biểu tượng chính bên trái (dùng chung)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FOOTER_ICON_KEYS.map((key) => {
                  const selected = config.concierge.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={FOOTER_ICON_LABELS[key]}
                      onClick={() => {
                        setStatus(null);
                        setConfig((prev) => ({
                          ...prev,
                          concierge: { ...prev.concierge, icon: key },
                        }));
                      }}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        selected
                          ? 'bg-[#866526] text-white border-[#866526] shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-[#C5A456] hover:text-[#866526]'
                      }`}
                    >
                      <FooterIcon icon={key} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tiêu đề chính ({langTag})
              </label>
              <input
                type="text"
                value={config.concierge.title[activeLang] ?? ''}
                onChange={(e) => updateConciergeText('title', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Ví dụ: Cần Hỗ Trợ Trực Tiếp?'
                    : config.concierge.title.vi || 'Need Personal Assistance?'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mô tả phụ ({langTag})
              </label>
              <input
                type="text"
                value={config.concierge.subtitle[activeLang] ?? ''}
                onChange={(e) => updateConciergeText('subtitle', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Ví dụ: Đội ngũ Quản gia & Lễ tân luôn sẵn sàng hỗ trợ Quý khách 24/7'
                    : config.concierge.subtitle.vi ||
                      'Our Butler & Front Desk team is always ready to assist you 24/7'
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>
          </div>

          {/* Badge Items List */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Các Thẻ Thông Tin Hỗ Trợ ({config.concierge.items.length}/12)
                </h3>
                <p className="text-xs text-slate-500">
                  Các thẻ hiển thị bên phải thanh hỗ trợ (số máy lễ tân, giờ phục vụ, an ninh, hotline bấm gọi...)
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                disabled={config.concierge.items.length >= 12}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] hover:bg-[#F3EAD7] disabled:opacity-50 transition-all"
              >
                <FiPlus className="w-4 h-4" />
                <span>Thêm Mục Hỗ Trợ</span>
              </button>
            </div>

            {config.concierge.items.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-xs text-slate-500">
                Chưa có thẻ thông tin nào. Bấm &quot;Thêm Mục Hỗ Trợ&quot; để tạo mới.
              </div>
            ) : (
              <div className="space-y-4">
                {config.concierge.items.map((item, idx) => {
                  const hasTranslationInActiveLang =
                    activeLang === 'vi' ||
                    Boolean(
                      item.label[activeLang]?.trim() ||
                        item.highlight?.[activeLang]?.trim() ||
                        item.suffix?.[activeLang]?.trim()
                    );

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                        item.isActive
                          ? 'bg-slate-50/50 border-slate-200/90'
                          : 'bg-slate-100/70 border-slate-200 opacity-75'
                      }`}
                    >
                      {/* Item toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/70">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#E6D3A7]/70 text-xs text-stone-700">
                            <FooterIcon
                              icon={item.icon}
                              className="w-3.5 h-3.5 text-[#866526]"
                            />
                            <span>
                              {item.label[activeLang] || (activeLang !== 'vi' && !hasTranslationInActiveLang ? item.label.vi : '')}
                              {(item.highlight?.[activeLang] || (activeLang !== 'vi' && !hasTranslationInActiveLang ? item.highlight?.vi : '')) && (
                                <>
                                  {' '}
                                  <strong>
                                    {item.highlight?.[activeLang] ||
                                      (activeLang !== 'vi' && !hasTranslationInActiveLang
                                        ? item.highlight?.vi
                                        : '')}
                                  </strong>
                                </>
                              )}
                              {(item.suffix?.[activeLang] || (activeLang !== 'vi' && !hasTranslationInActiveLang ? item.suffix?.vi : '')) && (
                                <>
                                  {' '}
                                  {item.suffix?.[activeLang] ||
                                    (activeLang !== 'vi' && !hasTranslationInActiveLang
                                      ? item.suffix?.vi
                                      : '')}
                                </>
                              )}
                              {!item.label.vi &&
                                !item.highlight?.vi &&
                                !item.suffix?.vi && (
                                  <span className="text-slate-400 italic">
                                    Chưa nhập nội dung
                                  </span>
                                )}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {activeLang !== 'vi' && (
                            <button
                              type="button"
                              onClick={() => copyViToCurrentLangForItem(idx)}
                              title="Sao chép từ Tiếng Việt để dịch nhanh"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white border border-slate-200 text-slate-600 hover:text-[#866526] hover:border-[#E6D3A7]"
                            >
                              <FiCopy className="w-3 h-3" />
                              <span className="hidden sm:inline">Chép từ VN</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              updateItem(idx, (it) => ({
                                ...it,
                                isActive: !it.isActive,
                              }))
                            }
                            title={item.isActive ? 'Ẩn mục này' : 'Hiện mục này'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <FiEye className="w-3.5 h-3.5" />
                                <span>Hiện</span>
                              </>
                            ) : (
                              <>
                                <FiEyeOff className="w-3.5 h-3.5" />
                                <span>Ẩn</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                            title="Di chuyển lên"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                          >
                            <FiArrowUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === config.concierge.items.length - 1}
                            title="Di chuyển xuống"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-35"
                          >
                            <FiArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            title="Xóa mục này"
                            className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item fields */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Biểu tượng
                          </label>
                          <select
                            value={item.icon}
                            onChange={(e) =>
                              updateItem(idx, (it) => ({
                                ...it,
                                icon: e.target.value as FooterIconKey,
                              }))
                            }
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                          >
                            {FOOTER_ICON_KEYS.map((key) => (
                              <option key={key} value={key}>
                                {FOOTER_ICON_LABELS[key]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Nội dung chính ({langTag})
                          </label>
                          <input
                            type="text"
                            value={item.label[activeLang] ?? ''}
                            onChange={(e) =>
                              updateItemLocalized(idx, 'label', e.target.value)
                            }
                            placeholder={
                              activeLang === 'vi'
                                ? 'VD: Bấm phím / Dịch vụ phòng:'
                                : item.label.vi || 'Label...'
                            }
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            In đậm ({langTag})
                          </label>
                          <input
                            type="text"
                            value={item.highlight?.[activeLang] ?? ''}
                            onChange={(e) =>
                              updateItemLocalized(
                                idx,
                                'highlight',
                                e.target.value
                              )
                            }
                            placeholder={
                              activeLang === 'vi'
                                ? 'VD: 100 / 24/24'
                                : item.highlight?.vi || '100'
                            }
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Hậu tố ({langTag})
                          </label>
                          <input
                            type="text"
                            value={item.suffix?.[activeLang] ?? ''}
                            onChange={(e) =>
                              updateItemLocalized(idx, 'suffix', e.target.value)
                            }
                            placeholder={
                              activeLang === 'vi'
                                ? 'VD: (Lễ tân)'
                                : item.suffix?.vi || '(Front Desk)'
                            }
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                          />
                        </div>

                        <div className="md:col-span-12">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Liên kết khi khách chạm (tùy chọn — dùng chung cho mọi ngôn ngữ)
                          </label>
                          <input
                            type="text"
                            value={item.href ?? ''}
                            onChange={(e) =>
                              updateItem(idx, (it) => ({
                                ...it,
                                href: e.target.value,
                              }))
                            }
                            placeholder="VD: tel:02973866888 hoặc mailto:info@resort.vn hoặc https://zalo.me/..."
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Bottom Brand Footer */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7EE] border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
              <FiLayout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                4. Chân Trang Thương Hiệu (Bottom Footer)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Phần cuối cùng trên mọi trang khách: tên resort, lời chào, thông tin liên hệ và bản quyền
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={config.brandFooter.enabled}
              onChange={(e) => {
                setStatus(null);
                setConfig((prev) => ({
                  ...prev,
                  brandFooter: {
                    ...prev.brandFooter,
                    enabled: e.target.checked,
                  },
                }));
              }}
              className="w-4 h-4 rounded accent-[#866526]"
            />
            <span className="text-xs font-semibold text-slate-700">
              {config.brandFooter.enabled ? 'Đang hiển thị' : 'Đang ẩn'}
            </span>
          </label>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tên Resort / Thương hiệu ({langTag})
              </label>
              <input
                type="text"
                value={config.brandFooter.resortName[activeLang] ?? ''}
                onChange={(e) => updateBrandText('resortName', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? 'Hòa Bình Rạch Giá Resort'
                    : config.brandFooter.resortName.vi
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Dòng chào mừng ({langTag})
              </label>
              <input
                type="text"
                value={config.brandFooter.welcomeText[activeLang] ?? ''}
                onChange={(e) => updateBrandText('welcomeText', e.target.value)}
                placeholder={
                  activeLang === 'vi'
                    ? '★★★★ HÂN HẠNH ĐƯỢC ĐÓN TIẾP & PHỤC VỤ QUÝ KHÁCH'
                    : config.brandFooter.welcomeText.vi
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Dòng bản quyền ({langTag})
            </label>
            <input
              type="text"
              value={config.brandFooter.copyrightText[activeLang] ?? ''}
              onChange={(e) => updateBrandText('copyrightText', e.target.value)}
              placeholder={
                activeLang === 'vi'
                  ? '© {year} Hòa Bình Rạch Giá Resort • Hòa Giang Hospitality. Bảo lưu mọi quyền.'
                  : config.brandFooter.copyrightText.vi
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Mẹo: Sử dụng <code className="px-1 py-0.5 bg-slate-100 rounded text-slate-600">{'{year}'}</code> để hệ thống tự động điền năm hiện tại ({getCurrentYearVN()}).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thông tin liên hệ bổ sung (tùy chọn — để trống sẽ không hiển thị)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Địa chỉ ({langTag})
                </label>
                <input
                  type="text"
                  value={config.brandFooter.address[activeLang] ?? ''}
                  onChange={(e) => updateBrandText('address', e.target.value)}
                  placeholder={
                    activeLang === 'vi'
                      ? 'VD: 62 Cô Bắc, Rạch Giá, Kiên Giang'
                      : config.brandFooter.address.vi || 'Resort address...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Hotline (dùng chung)
                </label>
                <input
                  type="text"
                  value={config.brandFooter.hotline}
                  onChange={(e) => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      brandFooter: {
                        ...prev.brandFooter,
                        hotline: e.target.value,
                      },
                    }));
                  }}
                  placeholder="VD: 0297 386 6888"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email liên hệ (dùng chung)
                </label>
                <input
                  type="email"
                  value={config.brandFooter.email}
                  onChange={(e) => {
                    setStatus(null);
                    setConfig((prev) => ({
                      ...prev,
                      brandFooter: {
                        ...prev.brandFooter,
                        email: e.target.value,
                      },
                    }));
                  }}
                  placeholder="VD: info@hoabinhresort.vn"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card sticky bottom-4 z-20">
        <button
          type="button"
          onClick={handleResetDefaults}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-50"
        >
          <FiRotateCcw className="w-4 h-4" />
          <span>Khôi Phục Mặc Định</span>
        </button>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">
              Có thay đổi chưa được lưu
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 transition-all disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>
      {/* Live Admin Welcome Popup Preview Modal */}
      {previewPopupOpen && (
        <WelcomePopup
          token="preview"
          config={{ ...config.welcomePopup, enabled: true }}
          branding={config.branding}
          wifi={{
            infoId: 'preview',
            ssid: {
              vi: 'HOA BINH RACH GIA',
              en: 'HOA BINH RACH GIA',
              zh: 'HOA BINH RACH GIA',
            },
            password: {
              vi: 'hoagiangkg',
              en: 'hoagiangkg',
              zh: 'hoagiangkg',
            },
          }}
          forceOpen
          onCloseOverride={() => setPreviewPopupOpen(false)}
          languageOverride={activeLang}
          onLanguageChangeOverride={setActiveLang}
        />
      )}
    </form>
  );
}
