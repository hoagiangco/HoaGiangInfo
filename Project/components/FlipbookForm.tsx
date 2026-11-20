'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiUpload,
  FiX,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiFileText,
} from 'react-icons/fi';
import Image from 'next/image';
import {
  convertPdfToImageFiles,
  expandFilesWithPdfConversion,
  PdfConversionProgress,
} from '@/lib/pdf-to-images';

interface Flipbook {
  id: string;
  name: string;
  description: string | null;
  pages: string[];
  isActive: boolean;
}

interface FlipbookFormProps {
  flipbook?: Flipbook;
}

export default function FlipbookForm({ flipbook }: FlipbookFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [convertingPdf, setConvertingPdf] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<PdfConversionProgress | null>(
    null
  );
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: flipbook?.name || '',
    description: flipbook?.description || '',
    isActive: flipbook?.isActive !== undefined ? flipbook.isActive : true,
  });
  const [pages, setPages] = useState<string[]>(flipbook?.pages || []);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);

  // Track initial values to detect changes
  const initialFormData = {
    name: flipbook?.name || '',
    description: flipbook?.description || '',
    isActive: flipbook?.isActive !== undefined ? flipbook.isActive : true,
  };
  const initialPages = flipbook?.pages || [];

  // Check if form has changes
  const hasChanges =
    formData.name !== initialFormData.name ||
    formData.description !== initialFormData.description ||
    formData.isActive !== initialFormData.isActive ||
    JSON.stringify(pages) !== JSON.stringify(initialPages) ||
    uploadingFiles.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        setError('Tên flipbook là bắt buộc');
        setLoading(false);
        return;
      }

      if (pages.length === 0 && uploadingFiles.length === 0) {
        setError('Flipbook phải có ít nhất một trang');
        setLoading(false);
        return;
      }

      let finalPages = [...pages];

      // If there are new files to upload, upload them first
      if (uploadingFiles.length > 0) {
        const formDataUpload = new FormData();
        uploadingFiles.forEach((file) => {
          formDataUpload.append('files', file);
        });

        const uploadResponse = await fetch('/api/flipbook/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload files');
        }

        const uploadResult = await uploadResponse.json();
        finalPages = [...pages, ...uploadResult.pages];
      }

      // If editing existing flipbook
      if (flipbook) {
        const response = await fetch(`/api/flipbook/${flipbook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            pages: finalPages,
            isActive: formData.isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update flipbook');
        }
      } else {
        // Create new flipbook using already uploaded finalPages
        const response = await fetch('/api/flipbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            pages: finalPages,
            isActive: formData.isActive,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create flipbook');
        }
      }

      router.push('/admin/flipbooks');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
      console.error('Error saving flipbook:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // Reset input immediately
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isPDF =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isImage = file.type.startsWith('image/');
      return isPDF || isImage;
    });

    if (validFiles.length !== files.length) {
      setError('Chỉ chấp nhận file hình ảnh hoặc PDF');
      return;
    }

    setError('');
    setConvertingPdf(true);
    try {
      const expandedFiles = await expandFilesWithPdfConversion(validFiles, (progress) => {
        setConversionProgress(progress);
      });
      setUploadingFiles((prev) => [...prev, ...expandedFiles]);
    } catch (err: any) {
      console.error('Error converting PDF to images:', err);
      setError(
        err.message ||
          'Không thể tách trang file PDF. Vui lòng kiểm tra lại file PDF của bạn.'
      );
    } finally {
      setConvertingPdf(false);
      setConversionProgress(null);
    }
  }

  async function handleConvertExistingPdfPage(index: number, pdfUrl: string) {
    setError('');
    setConvertingPdf(true);
    try {
      const imageFiles = await convertPdfToImageFiles(pdfUrl, {
        onProgress: (progress) => setConversionProgress(progress),
      });

      const formDataUpload = new FormData();
      imageFiles.forEach((file) => formDataUpload.append('files', file));

      const uploadResponse = await fetch('/api/flipbook/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Không thể tải lên các trang ảnh đã tách');
      }

      const uploadResult = await uploadResponse.json();
      const newPageUrls: string[] = uploadResult.pages;

      setPages((prev) => {
        const updated = [...prev];
        updated.splice(index, 1, ...newPageUrls);
        return updated;
      });
    } catch (err: any) {
      console.error('Error converting existing PDF page:', err);
      setError(err.message || 'Không thể tách trang từ file PDF này');
    } finally {
      setConvertingPdf(false);
      setConversionProgress(null);
    }
  }

  function removeUploadingFile(index: number) {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removePage(index: number) {
    if (pages.length <= 1 && uploadingFiles.length === 0) {
      setError('Flipbook phải có ít nhất một trang');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
    setError('');
  }

  function movePageUp(index: number) {
    if (index === 0) return;
    setPages((prev) => {
      const newPages = [...prev];
      [newPages[index - 1], newPages[index]] = [newPages[index], newPages[index - 1]];
      return newPages;
    });
  }

  function movePageDown(index: number) {
    if (index === pages.length - 1) return;
    setPages((prev) => {
      const newPages = [...prev];
      [newPages[index], newPages[index + 1]] = [newPages[index + 1], newPages[index]];
      return newPages;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên Flipbook <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Files (Hình ảnh hoặc PDF nhiều trang)
        </label>
        <div className="border-2 border-dashed border-gray-300 hover:border-[#B58E38] rounded-xl p-6 transition-colors bg-white">
          <input
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={convertingPdf || loading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center ${
              convertingPdf ? 'cursor-wait opacity-70' : 'cursor-pointer'
            }`}
          >
            <FiUpload className="w-8 h-8 text-[#866526] mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {convertingPdf
                ? 'Đang tự động tách từng trang PDF thành hình ảnh sắc nét...'
                : 'Click để chọn file hình ảnh hoặc file PDF thực đơn'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Hỗ trợ: PDF (tự động tách tất cả các trang), JPG, PNG, WEBP
            </span>
          </label>
        </div>

        {convertingPdf && conversionProgress && (
          <div className="mt-3 p-3.5 bg-[#FAF7EE] border border-[#E6D3A7] rounded-xl flex items-center justify-between text-xs text-[#684B1B]">
            <div className="flex items-center gap-2 font-medium">
              <FiRefreshCw className="w-4 h-4 animate-spin text-[#866526]" />
              <span>
                Đang tách trang {conversionProgress.currentPage} /{' '}
                {conversionProgress.totalPages} từ file &ldquo;
                {conversionProgress.fileName}&rdquo;...
              </span>
            </div>
            <span className="font-mono font-bold">
              {Math.round(
                (conversionProgress.currentPage / conversionProgress.totalPages) * 100
              )}
              %
            </span>
          </div>
        )}

        {uploadingFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {uploadingFiles.length} trang mới đã sẵn sàng (sẽ được tải lên khi bấm Lưu)
              </p>
              <button
                type="button"
                onClick={() => setUploadingFiles([])}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Xóa tất cả trang mới
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {uploadingFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative border border-gray-200 bg-white rounded-xl p-2 shadow-sm"
                >
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={200}
                      height={260}
                      unoptimized
                      className="w-full h-36 object-contain bg-stone-50 rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-600">PDF</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeUploadingFile(index)}
                    className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                    title="Bỏ trang này"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-xs font-medium text-gray-700 mt-1.5 truncate">
                    Trang mới #{index + 1}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Các trang hiện có trong Flipbook ({pages.length} trang)
          </label>
          <div className="space-y-3">
            {pages.map((pageUrl, index) => {
              const isPdf = pageUrl.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={`page-${index}-${pageUrl}`}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div className="flex-shrink-0 w-20 h-24 relative bg-white rounded-lg border overflow-hidden flex items-center justify-center">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-amber-700 p-2 text-center">
                        <FiFileText className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">PDF</span>
                      </div>
                    ) : (
                      <Image
                        src={pageUrl}
                        alt={`Page ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      Trang {index + 1}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{pageUrl}</p>
                    {isPdf && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          File PDF chưa được tách trang ảnh
                        </span>
                        <button
                          type="button"
                          disabled={convertingPdf}
                          onClick={() => handleConvertExistingPdfPage(index, pageUrl)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#866526] hover:bg-[#684B1B] text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FiRefreshCw
                            className={`w-3.5 h-3.5 ${convertingPdf ? 'animate-spin' : ''}`}
                          />
                          <span>Tách PDF này thành các trang ảnh ngay</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => movePageUp(index)}
                      disabled={index === 0}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Lên trên"
                    >
                      <FiArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePageDown(index)}
                      disabled={index === pages.length - 1}
                      className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Xuống dưới"
                    >
                      <FiArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm('Bạn có chắc muốn xóa trang này?')) {
                          removePage(index);
                        }
                      }}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Xóa"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
          Kích hoạt flipbook này
        </label>
      </div>

      <div className="flex gap-4">
        {flipbook && !hasChanges && (
          <div className="text-sm text-gray-500 flex items-center">
            Không có thay đổi
          </div>
        )}
        <button
          type="submit"
          disabled={
            loading ||
            convertingPdf ||
            (pages.length === 0 && uploadingFiles.length === 0) ||
            (flipbook && !hasChanges)
          }
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading
            ? 'Đang lưu...'
            : convertingPdf
            ? 'Đang tách trang PDF...'
            : flipbook
            ? 'Cập nhật'
            : 'Tạo Flipbook'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/flipbooks')}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
