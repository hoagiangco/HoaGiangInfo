'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import Image from 'next/image';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    description: menu?.description || '',
    fileUrl: menu?.fileUrl || '',
    fileType: menu?.fileType || '',
    flipbookId: menu?.flipbookId || '',
    isActive: menu?.isActive !== undefined ? menu.isActive : true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [flipbookFiles, setFlipbookFiles] = useState<File[]>([]);
  const [availableFlipbooks, setAvailableFlipbooks] = useState<any[]>([]);
  const [showFlipbookCreator, setShowFlipbookCreator] = useState(false);
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

      // Prepare data, ensuring empty strings become null for optional fields
      const submitData = {
        name: formData.name,
        description: formData.description?.trim() || null,
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên Menu *
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
          Mô tả
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
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
                flipbookId: '',
              });
            } else if (value === 'flipbook') {
              setFormData({
                ...formData,
                fileType: 'flipbook',
                fileUrl: '',
              });
            } else {
              setFormData({
                ...formData,
                fileType: value,
                flipbookId: '',
              });
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
        >
          <option value="none">Không có file</option>
          <option value="pdf">PDF</option>
          <option value="image">Hình ảnh</option>
          <option value="flipbook">Flipbook</option>
        </select>

        {/* PDF/Image Upload */}
        {(formData.fileType === 'pdf' || formData.fileType === 'image') && (
          <div className="mt-3">
            <FileUpload
              accept={formData.fileType === 'pdf' ? '.pdf' : 'image/*'}
              maxSize={20}
              onFileSelect={async (selectedFile) => {
                if (selectedFile) {
                  setFile(selectedFile);
                  setLoading(true);
                  try {
                    const formDataUpload = new FormData();
                    formDataUpload.append('file', selectedFile);
                    
                    const isPDF = selectedFile.type === 'application/pdf';
                    const endpoint = isPDF ? '/api/upload/floor-plan' : '/api/upload/image';
                    
                    const response = await fetch(endpoint, {
                      method: 'POST',
                      body: formDataUpload,
                    });

                    if (!response.ok) {
                      throw new Error('Failed to upload file');
                    }

                    const data = await response.json();
                    setFormData({
                      ...formData,
                      fileUrl: data.url,
                    });
                  } catch (err) {
                    console.error('Error uploading file:', err);
                    setError('Failed to upload file');
                  } finally {
                    setLoading(false);
                  }
                } else {
                  setFile(null);
                  setFormData({
                    ...formData,
                    fileUrl: '',
                  });
                }
              }}
              currentFileUrl={formData.fileUrl || undefined}
              label={`Upload ${formData.fileType === 'pdf' ? 'PDF' : 'Image'} File`}
              preview={false}
            />
            {formData.fileUrl && (
              <p className="text-sm text-gray-500 mt-1">
                Current file: <a href={formData.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{formData.fileUrl}</a>
              </p>
            )}
          </div>
        )}

        {/* Flipbook Selection */}
        {formData.fileType === 'flipbook' && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn Flipbook có sẵn
              </label>
              <select
                value={formData.flipbookId || ''}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    flipbookId: e.target.value,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">-- Chọn flipbook --</option>
                {availableFlipbooks
                  .filter((fb) => fb.isActive)
                  .map((fb) => (
                    <option key={fb.id} value={fb.id}>
                      {fb.name} ({fb.pages.length} trang)
                    </option>
                  ))}
              </select>
            </div>

            <div className="border-t pt-3">
              <button
                type="button"
                onClick={() => setShowFlipbookCreator(!showFlipbookCreator)}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                {showFlipbookCreator ? 'Ẩn' : 'Tạo Flipbook mới'}
              </button>

              {showFlipbookCreator && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên Flipbook *
                    </label>
                    <input
                      type="text"
                      value={newFlipbookName}
                      onChange={(e) => setNewFlipbookName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ví dụ: Menu Nhà Hàng 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Files (PDF hoặc Images) *
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFlipbookFiles(Array.from(e.target.files));
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Có thể chọn nhiều file (hình ảnh hoặc PDF). Mỗi file sẽ là một trang trong flipbook.
                      <br />
                      <span className="text-orange-600">Lưu ý: PDF sẽ được hiển thị dưới dạng link, nên chuyển PDF thành hình ảnh trước để có trải nghiệm tốt hơn.</span>
                    </p>
                    {flipbookFiles.length > 0 && (
                      <p className="text-sm text-gray-700 mt-2">
                        Đã chọn {flipbookFiles.length} file
                      </p>
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
                        setFormData({
                          ...formData,
                          flipbookId: flipbook.id,
                        });
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
                    disabled={loading || !newFlipbookName || flipbookFiles.length === 0}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                  >
                    Tạo Flipbook
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

