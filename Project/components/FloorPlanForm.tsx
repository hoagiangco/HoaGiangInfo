'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';
import AdminLanguageTabs from './AdminLanguageTabs';
import AdminDeleteButton from './AdminDeleteButton';
import {
  parseTranslations,
  type FloorPlanTranslationFields,
  type RoomTranslationFields,
  type TranslationMap,
} from '@/lib/translations';
import { languageAdminLabels, type Language } from '@/lib/i18n';

interface Room {
  id: string;
  number: string;
  type: string;
  description: string | null;
  translations?: unknown;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface EditableRoom extends Omit<Room, 'translations'> {
  translations: TranslationMap<RoomTranslationFields>;
}

interface FloorPlan {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
  imageUrl: string | null;
  fileType: string | null;
  isActive: boolean;
  rooms: Room[];
}

interface FloorPlanFormProps {
  floorPlan?: FloorPlan;
}

function hydrateRoom(room: Room): EditableRoom {
  const parsed = parseTranslations<RoomTranslationFields>(room.translations);
  return {
    ...room,
    translations: {
      en: { description: parsed.en?.description || '' },
      zh: { description: parsed.zh?.description || '' },
    },
  };
}

export default function FloorPlanForm({ floorPlan }: FloorPlanFormProps) {
  const router = useRouter();
  const initialTranslations = parseTranslations<FloorPlanTranslationFields>(
    floorPlan?.translations
  );

  const [activeLang, setActiveLang] = useState<Language>('vi');
  const [roomLangs, setRoomLangs] = useState<Record<string, Language>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: floorPlan?.name || '',
    description: floorPlan?.description || '',
    fileType: floorPlan?.fileType || 'image',
    isActive: floorPlan?.isActive !== undefined ? floorPlan.isActive : true,
  });
  const [imageUrl, setImageUrl] = useState(floorPlan?.imageUrl || '');

  const [translations, setTranslations] = useState<
    TranslationMap<FloorPlanTranslationFields>
  >({
    en: {
      name: initialTranslations.en?.name || '',
      description: initialTranslations.en?.description || '',
      imageUrl: initialTranslations.en?.imageUrl || '',
      fileType: initialTranslations.en?.fileType || '',
    },
    zh: {
      name: initialTranslations.zh?.name || '',
      description: initialTranslations.zh?.description || '',
      imageUrl: initialTranslations.zh?.imageUrl || '',
      fileType: initialTranslations.zh?.fileType || '',
    },
  });

  const [rooms, setRooms] = useState<EditableRoom[]>(
    (floorPlan?.rooms || []).map(hydrateRoom)
  );
  const [originalRoomIds] = useState<Set<string>>(
    new Set((floorPlan?.rooms || []).map((r) => r.id))
  );

  function updatePlanLocalized(
    field: keyof FloorPlanTranslationFields,
    value: string
  ) {
    if (activeLang === 'vi') {
      if (field === 'imageUrl') {
        setImageUrl(value);
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
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

  function getPlanLocalized(field: keyof FloorPlanTranslationFields): string {
    if (activeLang === 'vi') {
      if (field === 'imageUrl') return imageUrl;
      return (formData as Record<string, any>)[field] || '';
    }
    return translations[activeLang]?.[field] || '';
  }

  const planFilled = {
    vi: Boolean(formData.name.trim()),
    en: Boolean(
      translations.en?.name?.trim() ||
        translations.en?.description?.trim() ||
        translations.en?.imageUrl?.trim()
    ),
    zh: Boolean(
      translations.zh?.name?.trim() ||
        translations.zh?.description?.trim() ||
        translations.zh?.imageUrl?.trim()
    ),
  };

  async function uploadFloorPlan(file: File): Promise<string | null> {
    try {
      const fd = new FormData();
      fd.append('file', file);

      const response = await fetch('/api/upload/floor-plan', {
        method: 'POST',
        body: fd,
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
    if (!formData.name.trim()) {
      setActiveLang('vi');
      setError('Vui lòng nhập Tên Floor Plan (Tiếng Việt).');
      return;
    }

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
          translations,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save floor plan');
      }

      const savedPlan = await response.json();

      // Delete removed rooms when editing
      if (floorPlan) {
        const currentIds = new Set(rooms.map((r) => r.id));
        for (const origId of originalRoomIds) {
          if (!currentIds.has(origId)) {
            await fetch(`/api/rooms/${origId}`, { method: 'DELETE' });
          }
        }
      }

      // Create / update rooms
      for (const room of rooms) {
        if (!room.number.trim()) continue;
        if (room.id.startsWith('new-')) {
          await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              floorPlanId: savedPlan.id,
              number: room.number,
              type: room.type,
              description: room.description,
              translations: room.translations,
              x: room.x,
              y: room.y,
              width: room.width,
              height: room.height,
            }),
          });
        } else {
          await fetch(`/api/rooms/${room.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: room.number,
              type: room.type,
              description: room.description,
              translations: room.translations,
              x: room.x,
              y: room.y,
              width: room.width,
              height: room.height,
            }),
          });
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
        translations: {
          en: { description: '' },
          zh: { description: '' },
        },
        x: null,
        y: null,
        width: null,
        height: null,
      },
    ]);
  }

  function updateRoom(index: number, field: keyof EditableRoom, value: any) {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  }

  function updateRoomDescription(index: number, lang: Language, value: string) {
    const newRooms = [...rooms];
    const target = newRooms[index];
    if (lang === 'vi') {
      newRooms[index] = { ...target, description: value };
    } else {
      newRooms[index] = {
        ...target,
        translations: {
          ...target.translations,
          [lang]: { description: value },
        },
      };
    }
    setRooms(newRooms);
  }

  function getRoomDescription(room: EditableRoom, lang: Language): string {
    if (lang === 'vi') return room.description || '';
    return room.translations[lang]?.description || '';
  }

  function removeRoom(index: number) {
    setRooms(rooms.filter((_, i) => i !== index));
  }

  const currentFileUrl = getPlanLocalized('imageUrl');
  const currentFileType =
    getPlanLocalized('fileType') || formData.fileType || 'image';

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
        filled={planFilled}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tên Sơ Đồ ({languageAdminLabels[activeLang]})
          {activeLang === 'vi' && ' *'}
        </label>
        <input
          type="text"
          value={getPlanLocalized('name')}
          onChange={(e) => updatePlanLocalized('name', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? formData.name || 'e.g., Floor 5 Room Map'
              : activeLang === 'zh'
              ? formData.name || '例如：5楼客房平面图'
              : 'Ví dụ: Sơ đồ phòng tầng 5'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required={activeLang === 'vi'}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mô tả ({languageAdminLabels[activeLang]})
        </label>
        <textarea
          value={getPlanLocalized('description')}
          onChange={(e) => updatePlanLocalized('description', e.target.value)}
          placeholder={
            activeLang === 'en'
              ? 'English floor plan description...'
              : activeLang === 'zh'
              ? '中文楼层平面图介绍...'
              : 'Mô tả chi tiết sơ đồ...'
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">
            Bản vẽ sơ đồ — {languageAdminLabels[activeLang]}
          </p>
          {activeLang !== 'vi' && (
            <span className="text-xs text-stone-500">
              Tùy chọn: chỉ tải lên nếu bạn có bản vẽ chú thích riêng bằng ngôn
              ngữ này
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại File ({activeLang.toUpperCase()})
          </label>
          <select
            value={currentFileType}
            onChange={(e) => updatePlanLocalized('fileType', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="image">Image</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <FileUpload
          accept={
            currentFileType === 'pdf' ? '.pdf,application/pdf' : 'image/*'
          }
          maxSize={20}
          onFileSelect={async (file) => {
            if (file) {
              setLoading(true);
              try {
                const url = await uploadFloorPlan(file);
                if (url) {
                  const detectedType = file.type.startsWith('image/')
                    ? 'image'
                    : 'pdf';
                  updatePlanLocalized('imageUrl', url);
                  updatePlanLocalized('fileType', detectedType);
                } else {
                  setError('Failed to upload floor plan');
                }
              } catch {
                setError('Failed to upload floor plan');
              } finally {
                setLoading(false);
              }
            } else {
              updatePlanLocalized('imageUrl', '');
            }
          }}
          currentFileUrl={currentFileUrl || undefined}
          label={`Upload Floor Plan (${activeLang.toUpperCase()})`}
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
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Danh sách phòng (Rooms)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Hỗ trợ dịch mô tả từng phòng sang Tiếng Việt, Tiếng Anh và Tiếng
              Trung
            </p>
          </div>
          <button
            type="button"
            onClick={addRoom}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Thêm Room
          </button>
        </div>

        <div className="space-y-4">
          {rooms.map((room, index) => {
            const curLang = roomLangs[room.id] || 'vi';
            const roomFilled = {
              vi: Boolean(room.description?.trim()),
              en: Boolean(room.translations.en?.description?.trim()),
              zh: Boolean(room.translations.zh?.description?.trim()),
            };

            return (
              <div
                key={room.id}
                className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Phòng {room.number || `#${index + 1}`}
                  </span>
                  <AdminLanguageTabs
                    compact
                    activeLang={curLang}
                    onChange={(lang) =>
                      setRoomLangs((prev) => ({ ...prev, [room.id]: lang }))
                    }
                    filled={roomFilled}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại phòng
                    </label>
                    <select
                      value={room.type}
                      onChange={(e) =>
                        updateRoom(index, 'type', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                    >
                      <option value="standard">Standard</option>
                      <option value="deluxe">Deluxe</option>
                      <option value="suite">Suite</option>
                      <option value="villa">Villa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả phòng ({curLang.toUpperCase()})
                  </label>
                  <textarea
                    value={getRoomDescription(room, curLang)}
                    onChange={(e) =>
                      updateRoomDescription(index, curLang, e.target.value)
                    }
                    placeholder={
                      curLang === 'en'
                        ? 'English room description...'
                        : curLang === 'zh'
                        ? '中文客房描述...'
                        : 'Mô tả phòng Tiếng Việt...'
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={room.x ?? ''}
                      onChange={(e) =>
                        updateRoom(
                          index,
                          'x',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
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
                      value={room.y ?? ''}
                      onChange={(e) =>
                        updateRoom(
                          index,
                          'y',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
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
                      value={room.width ?? ''}
                      onChange={(e) =>
                        updateRoom(
                          index,
                          'width',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
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
                      value={room.height ?? ''}
                      onChange={(e) =>
                        updateRoom(
                          index,
                          'height',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
                      placeholder="0-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeRoom(index)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                  >
                    Xóa Room
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang lưu...' : floorPlan ? 'Cập nhật' : 'Tạo mới'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Hủy
        </button>
        {floorPlan && (
          <AdminDeleteButton
            endpoint={`/api/floor-plan/${floorPlan.id}`}
            itemName={floorPlan.name}
            entityLabel="sơ đồ phòng"
            redirectTo="/admin/floor-plans"
            variant="form"
            disabled={loading}
            className="ml-auto"
            warningNote={
              rooms.length > 0
                ? `Tất cả ${rooms.length} phòng được định vị trong sơ đồ này cũng sẽ bị xóa.`
                : undefined
            }
          />
        )}
      </div>
    </form>
  );
}
