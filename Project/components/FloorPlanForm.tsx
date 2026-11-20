'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';

interface Room {
  id: string;
  number: string;
  type: string;
  description: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface FloorPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  fileType: string | null;
  isActive: boolean;
  rooms: Room[];
}

interface FloorPlanFormProps {
  floorPlan?: FloorPlan;
}

export default function FloorPlanForm({ floorPlan }: FloorPlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: floorPlan?.name || '',
    description: floorPlan?.description || '',
    fileType: floorPlan?.fileType || 'image',
    isActive: floorPlan?.isActive !== undefined ? floorPlan.isActive : true,
  });
  const [imageUrl, setImageUrl] = useState(floorPlan?.imageUrl || '');
  const [rooms, setRooms] = useState<Room[]>(floorPlan?.rooms || []);

  async function uploadFloorPlan(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/floor-plan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload floor plan');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Error uploading floor plan:', err);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = floorPlan
        ? `/api/floor-plan/${floorPlan.id}`
        : '/api/floor-plan';
      const method = floorPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save floor plan');
      }

      const savedPlan = await response.json();

      // Save rooms
      if (floorPlan) {
        // Update existing rooms
        for (const room of rooms) {
          if (room.id.startsWith('new-')) {
            // Create new room
            await fetch('/api/rooms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                floorPlanId: savedPlan.id,
                number: room.number,
                type: room.type,
                description: room.description,
                x: room.x,
                y: room.y,
                width: room.width,
                height: room.height,
              }),
            });
          } else {
            // Update existing room
            await fetch(`/api/rooms/${room.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                number: room.number,
                type: room.type,
                description: room.description,
                x: room.x,
                y: room.y,
                width: room.width,
                height: room.height,
              }),
            });
          }
        }
      }

      router.push('/admin/floor-plans');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  function addRoom() {
    setRooms([
      ...rooms,
      {
        id: `new-${Date.now()}`,
        number: '',
        type: 'standard',
        description: null,
        x: null,
        y: null,
        width: null,
        height: null,
      },
    ]);
  }

  function updateRoom(index: number, field: keyof Room, value: any) {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  }

  function removeRoom(index: number) {
    setRooms(rooms.filter((_, i) => i !== index));
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
          Tên Floor Plan *
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
          Loại File
        </label>
        <select
          value={formData.fileType}
          onChange={(e) =>
            setFormData({ ...formData, fileType: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="image">Image</option>
          <option value="pdf">PDF</option>
        </select>
      </div>

      <div>
        <FileUpload
          accept={formData.fileType === 'pdf' ? '.pdf,application/pdf' : 'image/*'}
          maxSize={20}
          onFileSelect={async (file) => {
            if (file) {
              setLoading(true);
              try {
                const url = await uploadFloorPlan(file);
                if (url) {
                  setImageUrl(url);
                  const fileType = file.type.startsWith('image/') ? 'image' : 'pdf';
                  setFormData({ ...formData, fileType });
                } else {
                  setError('Failed to upload floor plan');
                }
              } catch (err) {
                setError('Failed to upload floor plan');
              } finally {
                setLoading(false);
              }
            } else {
              setImageUrl('');
            }
          }}
          currentFileUrl={imageUrl || undefined}
          label="Upload Floor Plan"
          preview={true}
        />
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

      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Rooms</h2>
          <button
            type="button"
            onClick={addRoom}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Thêm Room
          </button>
        </div>

        <div className="space-y-4">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
            >
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số phòng *
                  </label>
                  <input
                    type="text"
                    value={room.number}
                    onChange={(e) =>
                      updateRoom(index, 'number', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại phòng
                  </label>
                  <select
                    value={room.type}
                    onChange={(e) => updateRoom(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                    <option value="villa">Villa</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={room.description || ''}
                  onChange={(e) =>
                    updateRoom(index, 'description', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={room.x || ''}
                    onChange={(e) =>
                      updateRoom(index, 'x', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={room.y || ''}
                    onChange={(e) =>
                      updateRoom(index, 'y', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={room.width || ''}
                    onChange={(e) =>
                      updateRoom(index, 'width', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="0-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={room.height || ''}
                    onChange={(e) =>
                      updateRoom(index, 'height', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    placeholder="0-100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRoom(index)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Xóa Room
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang lưu...' : floorPlan ? 'Cập nhật' : 'Tạo mới'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}









