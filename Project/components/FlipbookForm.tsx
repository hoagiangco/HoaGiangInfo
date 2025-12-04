'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX, FiTrash2, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Image from 'next/image';

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
        // Get the uploaded page URLs
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
        // Create new flipbook
        if (uploadingFiles.length > 0) {
          // Upload files and create flipbook in one step
          const formDataUpload = new FormData();
          formDataUpload.append('name', formData.name);
          if (formData.description) {
            formDataUpload.append('description', formData.description);
          }
          formDataUpload.append('isActive', formData.isActive ? 'true' : 'false');
          uploadingFiles.forEach((file) => {
            formDataUpload.append('files', file);
          });

          const uploadResponse = await fetch('/api/flipbook/create', {
            method: 'POST',
            body: formDataUpload,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Failed to create flipbook');
          }

          const newFlipbook = await uploadResponse.json();
          
          // If there were existing pages, merge them and update
          if (pages.length > 0) {
            const allPages = [...pages, ...newFlipbook.pages];
            await fetch(`/api/flipbook/${newFlipbook.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name,
                description: formData.description || null,
                pages: allPages,
                isActive: formData.isActive,
              }),
            });
          } else if (newFlipbook.isActive !== formData.isActive) {
            // Just update isActive if needed
            await fetch(`/api/flipbook/${newFlipbook.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: formData.name,
                description: formData.description || null,
                pages: newFlipbook.pages,
                isActive: formData.isActive,
              }),
            });
          }
        } else {
          // Create flipbook without files (using existing pages)
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isPDF = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      return isPDF || isImage;
    });

    if (validFiles.length !== files.length) {
      setError('Chỉ chấp nhận file hình ảnh hoặc PDF');
      return;
    }

    setUploadingFiles((prev) => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  }

  function removeUploadingFile(index: number) {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removePage(index: number) {
    if (pages.length <= 1) {
      setError('Flipbook phải có ít nhất một trang');
      return;
    }
    setPages((prev) => {
      const newPages = prev.filter((_, i) => i !== index);
      return newPages;
    });
    setError(''); // Clear any previous errors
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
          Upload Files (Hình ảnh hoặc PDF)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              Click để chọn file hoặc kéo thả file vào đây
            </span>
            <span className="text-xs text-gray-500 mt-1">
              Hỗ trợ: JPG, PNG, PDF
            </span>
          </label>
        </div>

        {uploadingFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {uploadingFiles.length} file đã chọn (sẽ được upload khi lưu)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="relative border rounded-lg p-2">
                  {file.type.startsWith('image/') ? (
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      width={150}
                      height={150}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">PDF</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeUploadingFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {pages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Các trang trong Flipbook ({pages.length} trang)
          </label>
          <div className="space-y-3">
            {pages.map((pageUrl, index) => (
              <div
                key={`page-${index}-${pageUrl}`}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex-shrink-0 w-20 h-20 relative">
                  {pageUrl.endsWith('.pdf') ? (
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">PDF</span>
                    </div>
                  ) : (
                    <Image
                      src={pageUrl}
                      alt={`Page ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    Trang {index + 1}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{pageUrl}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => movePageUp(index)}
                    disabled={index === 0}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Lên trên"
                  >
                    <FiArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePageDown(index)}
                    disabled={index === pages.length - 1}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    title="Xóa"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
          disabled={loading || (pages.length === 0 && uploadingFiles.length === 0) || (flipbook && !hasChanges)}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang lưu...' : flipbook ? 'Cập nhật' : 'Tạo Flipbook'}
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

