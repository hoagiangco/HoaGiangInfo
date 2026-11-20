'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import Image from 'next/image';
import { expandFilesWithPdfConversion, PdfConversionProgress } from '@/lib/pdf-to-images';
import { parseMenuBilingual, serializeMenuBilingual } from '@/lib/bilingual-menu';
import { FiGlobe } from 'react-icons/fi';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Menu {
  id: string;
  name: string;
  description: string | null;
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

export default function MenuForm({ menu }: MenuFormProps) {
  const router = useRouter();
  const parsedBilingual = parseMenuBilingual(menu?.description);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    nameEn: parsedBilingual.nameEn || '',
    description: parsedBilingual.descriptionVi || '',
    descriptionEn: parsedBilingual.descriptionEn || '',
    fileUrl: menu?.fileUrl || '',
    fileUrlEn: parsedBilingual.fileUrlEn || '',
    fileType: menu?.fileType || '',
    flipbookId: menu?.flipbookId || '',
    flipbookEnId: parsedBilingual.flipbookEnId || '',
    isActive: menu?.isActive !== undefined ? menu.isActive : true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [flipbookFiles, setFlipbookFiles] = useState<File[]>([]);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<PdfConversionProgress | null>(null);
  const [availableFlipbooks, setAvailableFlipbooks] = useState<any[]>([]);
  const [showFlipbookCreator, setShowFlipbookCreator] = useState(false);
  const [creatorTargetLang, setCreatorTargetLang] = useState<'vi' | 'en'>('vi');
  const [newFlipbookName, setNewFlipbookName] = useState('');

  // Load available flipbooks
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
  const [items, setItems] = useState<MenuItem[]>(menu?.items || []);
  const [originalItemIds, setOriginalItemIds] = useState<Set<string>>(
    new Set(menu?.items.map((item) => item.id) || [])
  );

  useEffect(() => {
    if (menu) {
      setOriginalItemIds(new Set(menu.items.map((item) => item.id)));
    }
  }, [menu]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = menu ? `/api/menu/${menu.id}` : '/api/menu';
      const method = menu ? 'PUT' : 'POST';

      // Serialize bilingual fields into description
      const serializedDescription = serializeMenuBilingual({
        descriptionVi: formData.description,
        nameEn: formData.nameEn,
        descriptionEn: formData.descriptionEn,
        fileUrlEn: formData.fileType === 'flipbook' ? null : formData.fileUrlEn,
        flipbookEnId: formData.fileType === 'flipbook' ? formData.flipbookEnId : null,
      });

      const submitData = {
        name: formData.name,
        description: serializedDescription,
        isActive: formData.isActive,
        fileUrl: formData.fileType === 'flipbook' ? null : (formData.fileUrl?.trim() || null),
        fileType: formData.fileType?.trim() || null,
        flipbookId: formData.fileType === 'flipbook' ? (formData.flipbookId || null) : null,
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
        price: null,
        image: null,
        category: null,
        isAvailable: true,
      },
    ]);
  }

  function updateItem(index: number, field: keyof MenuItem, value: any) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  async function removeItem(index: number) {
    const itemToRemove = items[index];
    
    if (!itemToRemove) return;
    
    // Confirm deletion
    if (!confirm('Bạn có chắc chắn muốn xóa món này?')) {
      return;
    }
    
    // If item exists in database (not a new item), delete it from database
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
        
        // Update originalItemIds
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
    
    // Remove from local state
    setItems(items.filter((_, i) => i !== index));
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
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
      // Get current item IDs
      const currentItemIds = new Set(items.map((item) => item.id));
      
      // Delete items that were removed (exist in original but not in current)
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

      // Save or update current items
      for (const item of items) {
        let imageUrl = item.image;

        // If item has a new image file, upload it
        if (item.image && item.image.startsWith('blob:')) {
          // This is a preview URL, need to get the actual file
          // For now, skip - user should use FileUpload component
        }

        if (item.id.startsWith('new-')) {
          // Create new item
          const response = await fetch('/api/menu-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menuId: menu.id,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              image: imageUrl,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create item');
          }
        } else {
          // Update existing item
          const response = await fetch(`/api/menu-items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              image: imageUrl,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update item');
          }
        }
      }
      
      // Update original item IDs for next save
      setOriginalItemIds(new Set(items.filter(item => !item.id.startsWith('new-')).map(item => item.id)));
      
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên Menu (Tiếng Việt) *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ví dụ: Menu Ẩm Thực"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <FiGlobe className="w-4 h-4 text-[#866526]" />
            <span>Tên Menu (Tiếng Anh - Song ngữ)</span>
          </label>
          <input
            type="text"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Ví dụ: Culinary & Dining Menu"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả (Tiếng Việt)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả (Tiếng Anh - Tùy chọn)
          </label>
          <textarea
            value={formData.descriptionEn}
            onChange={(e) =>
              setFormData({ ...formData, descriptionEn: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={2}
          />
        </div>
      </div>

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
                fileUrlEn: '',
                flipbookId: '',
                flipbookEnId: '',
              });
            } else if (value === 'flipbook') {
              setFormData({
                ...formData,
                fileType: 'flipbook',
                fileUrl: '',
                fileUrlEn: '',
              });
            } else {
              setFormData({
                ...formData,
                fileType: value,
                flipbookId: '',
                flipbookEnId: '',
              });
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
        >
          <option value="none">Không có file (Chỉ hiển thị danh sách món)</option>
          <option value="pdf">PDF</option>
          <option value="image">Hình ảnh</option>
          <option value="flipbook">Flipbook</option>
        </select>

        {/* PDF/Image Upload (Bilingual VI + EN) */}
        {(formData.fileType === 'pdf' || formData.fileType === 'image') && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                1. Bản Tiếng Việt (Mặc định) *
              </p>
              <FileUpload
                accept={formData.fileType === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
                maxSize={20}
                onFileSelect={async (selectedFile) => {
                  if (selectedFile) {
                    setFile(selectedFile);
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
                      setFormData((prev) => ({
                        ...prev,
                        fileUrl: data.url,
                      }));
                    } catch (err) {
                      console.error('Error uploading file:', err);
                      setError('Failed to upload file');
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    setFile(null);
                    setFormData((prev) => ({
                      ...prev,
                      fileUrl: '',
                    }));
                  }
                }}
                currentFileUrl={formData.fileUrl || undefined}
                label={`Upload ${formData.fileType === 'pdf' ? 'PDF' : 'Image'} (VI)`}
                preview={false}
              />
              {formData.fileUrl && (
                <p className="text-xs text-gray-500 mt-1.5 truncate">
                  File VI:{' '}
                  <a
                    href={formData.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formData.fileUrl}
                  </a>
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[#E6D3A7] bg-[#FAF7EE]/60">
              <p className="text-xs font-bold uppercase tracking-wider text-[#866526] mb-2 flex items-center gap-1.5">
                <FiGlobe className="w-3.5 h-3.5" />
                <span>2. Bản Tiếng Anh (Song ngữ - Tùy chọn)</span>
              </p>
              <FileUpload
                accept={formData.fileType === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
                maxSize={20}
                onFileSelect={async (selectedFile) => {
                  if (selectedFile) {
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
                        throw new Error('Failed to upload English file');
                      }

                      const data = await response.json();
                      setFormData((prev) => ({
                        ...prev,
                        fileUrlEn: data.url,
                      }));
                    } catch (err) {
                      console.error('Error uploading English file:', err);
                      setError('Failed to upload English file');
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      fileUrlEn: '',
                    }));
                  }
                }}
                currentFileUrl={formData.fileUrlEn || undefined}
                label={`Upload ${formData.fileType === 'pdf' ? 'PDF' : 'Image'} (EN)`}
                preview={false}
              />
              {formData.fileUrlEn && (
                <div className="flex items-center justify-between mt-1.5 text-xs">
                  <span className="text-gray-500 truncate">
                    File EN:{' '}
                    <a
                      href={formData.fileUrlEn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {formData.fileUrlEn}
                    </a>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, fileUrlEn: '' }))}
                    className="text-red-600 hover:underline ml-2 shrink-0"
                  >
                    Xóa bản EN
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flipbook Selection (Bilingual VI + EN) */}
        {formData.fileType === 'flipbook' && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-white">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  1. Flipbook Tiếng Việt (Mặc định) *
                </label>
                <select
                  value={formData.flipbookId || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      flipbookId: e.target.value,
                    });
                  }}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Chọn flipbook Tiếng Việt --</option>
                  {availableFlipbooks
                    .filter((fb) => fb.isActive)
                    .map((fb) => (
                      <option key={fb.id} value={fb.id}>
                        {fb.name} ({fb.pages.length} trang)
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-4 rounded-xl border border-[#E6D3A7] bg-[#FAF7EE]/60">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#866526] mb-2 flex items-center gap-1.5">
                  <FiGlobe className="w-3.5 h-3.5" />
                  <span>2. Flipbook Tiếng Anh / Quốc tế (Tùy chọn)</span>
                </label>
                <select
                  value={formData.flipbookEnId || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      flipbookEnId: e.target.value,
                    });
                  }}
                  className="w-full px-3.5 py-2 border border-[#E6D3A7] bg-white rounded-lg text-sm"
                >
                  <option value="">-- Không dùng / Chỉ dùng 1 bản --</option>
                  {availableFlipbooks
                    .filter((fb) => fb.isActive)
                    .map((fb) => (
                      <option key={fb.id} value={fb.id}>
                        {fb.name} ({fb.pages.length} trang)
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  Khi khách chuyển ngôn ngữ sang English (hoặc bấm nút VI/EN trên trình xem), hệ thống sẽ tự động mở cuốn Flipbook này.
                </p>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorTargetLang('vi');
                    setShowFlipbookCreator(!showFlipbookCreator);
                  }}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  {showFlipbookCreator ? 'Ẩn khung tạo nhanh' : '+ Tạo nhanh Flipbook mới (VI hoặc EN)'}
                </button>
              </div>

              {showFlipbookCreator && (
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-gray-700">Gán sau khi tạo cho:</span>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        checked={creatorTargetLang === 'vi'}
                        onChange={() => setCreatorTargetLang('vi')}
                      />
                      <span>Bản Tiếng Việt (VI)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-[#866526]">
                      <input
                        type="radio"
                        checked={creatorTargetLang === 'en'}
                        onChange={() => setCreatorTargetLang('en')}
                      />
                      <span>Bản Tiếng Anh (EN)</span>
                    </label>
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
                          setError(err.message || 'Không thể tách trang file PDF');
                        } finally {
                          setConvertingPdf(false);
                          setConversionProgress(null);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Có thể chọn file PDF nhiều trang hoặc nhiều hình ảnh. Hệ thống sẽ tự động tách từng trang PDF thành hình ảnh sắc nét cho Flipbook.
                    </p>
                    {convertingPdf && conversionProgress && (
                      <p className="text-xs font-medium text-amber-700 mt-2">
                        Đang tách trang {conversionProgress.currentPage} / {conversionProgress.totalPages} từ file &ldquo;{conversionProgress.fileName}&rdquo;...
                      </p>
                    )}
                    {flipbookFiles.length > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-medium text-emerald-700">
                          Đã chuẩn bị {flipbookFiles.length} trang ảnh cho Flipbook
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
                        flipbookFiles.forEach((file) => {
                          formDataUpload.append('files', file);
                        });

                        const response = await fetch('/api/flipbook/create', {
                          method: 'POST',
                          body: formDataUpload,
                        });

                        if (!response.ok) {
                          const data = await response.json();
                          throw new Error(data.error || 'Failed to create flipbook');
                        }

                        const flipbook = await response.json();
                        setFormData((prev) => ({
                          ...prev,
                          ...(creatorTargetLang === 'en'
                            ? { flipbookEnId: flipbook.id }
                            : { flipbookId: flipbook.id }),
                        }));
                        setAvailableFlipbooks([...availableFlipbooks, flipbook]);
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
                    disabled={loading || convertingPdf || !newFlipbookName || flipbookFiles.length === 0}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    {convertingPdf
                      ? 'Đang tách trang PDF...'
                      : `Tạo & Gán vào bản ${creatorTargetLang === 'en' ? 'Tiếng Anh (EN)' : 'Tiếng Việt (VI)'}`}
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

      {menu && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Menu Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Thêm Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên món *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, 'name', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VND)
                    </label>
                    <input
                      type="number"
                      value={item.price || ''}
                      onChange={(e) =>
                        updateItem(index, 'price', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) =>
                      updateItem(index, 'description', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.category || ''}
                      onChange={(e) =>
                        updateItem(index, 'category', e.target.value)
                      }
                      placeholder="appetizer, main, dessert..."
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <FileUpload
                    accept="image/*"
                    maxSize={5}
                    onFileSelect={async (file) => {
                      if (file) {
                        setLoading(true);
                        try {
                          const url = await uploadImage(file);
                          if (url) {
                            updateItem(index, 'image', url);
                          } else {
                            setError('Failed to upload image');
                          }
                        } catch (err) {
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
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Xóa Item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={saveItems}
              disabled={loading}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              Lưu Items
            </button>
          )}
        </div>
      )}

      <div className="flex space-x-4">
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
      </div>
    </form>
  );
}

