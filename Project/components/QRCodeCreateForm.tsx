'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Module {
  id: string;
  name: string;
  displayName: string;
}

interface QRCodeCreateFormProps {
  allModules: Module[];
}

export default function QRCodeCreateForm({ allModules }: QRCodeCreateFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    description: '',
    type: 'guest',
    isActive: true,
  });
  const [selectedModules, setSelectedModules] = useState<string[]>(
    allModules.filter(m => m.name !== 'technical').map(m => m.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create QR code');
      }

      const qrCode = await response.json();

      for (const moduleId of selectedModules) {
        await fetch(`/api/qr/${qrCode.id}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId }),
        });
      }

      router.push('/admin/qr-codes');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo QR code');
    } finally {
      setLoading(false);
    }
  }

  function toggleModule(moduleId: string) {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  }

  const input = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526] transition-all';
  const label = 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-8 space-y-6 max-w-3xl">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className={label}>Tên Điểm Truy Cập *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={input}
          required
          placeholder="Ví dụ: Bàn 05 - Nhà Hàng Hoa Giang, Phòng Suite 302..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Token URL * (Duy nhất, không dấu, dùng dấu gạch ngang)</label>
          <input
            type="text"
            value={formData.token}
            onChange={(e) => setFormData({ ...formData, token: e.target.value })}
            className={input}
            required
            placeholder="vd: villa-302, ban-05, pool-bar"
          />
        </div>

        <div>
          <label className={label}>Phân Loại</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className={input}
          >
            <option value="guest">Khách hàng (Guest)</option>
            <option value="custom">Tùy chỉnh (Khu vực đặc biệt)</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Ghi Chú / Vị Trí Cụ Thể</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={input}
          rows={3}
          placeholder="Ví dụ: Đặt tại biển mica trên bàn ăn ngoài trời ven hồ..."
        />
      </div>

      <div>
        <label className={label}>Modules Được Phép Truy Cập</label>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-56 overflow-y-auto space-y-2">
          {allModules.map((module) => (
            <label
              key={module.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => toggleModule(module.id)}
                className="rounded border-slate-300 text-[#866526] focus:ring-[#866526]"
              />
              <span className="text-xs font-semibold text-slate-800">{module.displayName}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-slate-300 text-[#866526] focus:ring-[#866526]"
          />
          <span className="text-xs font-semibold text-slate-700">Kích hoạt mã QR ngay sau khi tạo</span>
        </label>
      </div>

      <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 disabled:bg-slate-300 transition-all"
        >
          {loading ? 'Đang tạo...' : 'Tạo Mã QR'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
