'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS, ROLES, ROLE_LABELS, type Role } from '@/lib/auth/permissions';
import { DOC_CATEGORIES, VISIBILITY_LABELS } from '@/lib/documents';

export interface DocumentFormValue {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  visibility: string;
  departments: string[];
  minRole: string | null;
  isActive: boolean;
  fileName: string | null;
  hasFile: boolean;
}

interface Props {
  document?: DocumentFormValue;
  canDelete?: boolean;
}

const ACCEPT = '.pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg';

export default function DocumentForm({ document: doc, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: doc?.title ?? '',
    category: doc?.category ?? 'procedures',
    description: doc?.description ?? '',
    content: doc?.content ?? '',
    visibility: doc?.visibility ?? 'ALL_STAFF',
    departments: doc?.departments ?? ([] as string[]),
    minRole: doc?.minRole ?? 'MANAGER',
    isActive: doc?.isActive ?? true,
  });

  function toggleDept(d: string) {
    setForm((f) => ({
      ...f,
      departments: f.departments.includes(d)
        ? f.departments.filter((x) => x !== d)
        : [...f.departments, d],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('description', form.description);
      fd.append('content', form.content);
      fd.append('visibility', form.visibility);
      fd.append('departments', JSON.stringify(form.departments));
      if (form.visibility === 'ROLE_MIN') fd.append('minRole', form.minRole);
      fd.append('isActive', String(form.isActive));
      if (file) fd.append('file', file);

      const res = await fetch(
        doc ? `/api/internal/documents/${doc.id}` : '/api/internal/documents',
        { method: doc ? 'PUT' : 'POST', body: fd }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không lưu được tài liệu');

      router.push('/admin/documents');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!doc || !confirm('Xóa tài liệu này? Không thể khôi phục.')) return;
    setLoading(true);
    const res = await fetch(`/api/internal/documents/${doc.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/documents');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Không xóa được');
      setLoading(false);
    }
  }

  const input = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526] transition-all';
  const label = 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5';
  const visibilityOptions = Object.entries(VISIBILITY_LABELS);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-8 space-y-6 max-w-4xl">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl">{error}</div>
      )}

      <div>
        <label className={label}>Tiêu đề *</label>
        <input className={input} value={form.title} maxLength={200} required
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Danh mục *</label>
          <select className={input} value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {Object.entries(DOC_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Ai được xem *</label>
          <select className={input} value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
            {visibilityOptions.map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {form.visibility === 'DEPARTMENT' && (
        <div>
          <label className={label}>Phòng ban được xem</label>
          <div className="flex flex-wrap gap-3">
            {DEPARTMENTS.map((d) => (
              <label key={d} className="flex items-center space-x-2 text-sm">
                <input type="checkbox" checked={form.departments.includes(d)} onChange={() => toggleDept(d)} />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {form.visibility === 'ROLE_MIN' && (
        <div>
          <label className={label}>Vai trò tối thiểu</label>
          <select className={input} value={form.minRole}
            onChange={(e) => setForm({ ...form, minRole: e.target.value })}>
            {ROLES.map((r: Role) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={label}>Mô tả</label>
        <textarea className={input} rows={3} maxLength={1000} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div>
        <label className={label}>Nội dung (HTML cơ bản, sẽ được lọc an toàn)</label>
        <textarea className={`${input} font-mono text-sm`} rows={8} value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </div>

      <div>
        <label className={label}>
          {doc?.hasFile ? 'Thay file đính kèm' : 'File đính kèm'} (PDF, DOCX, XLSX, PPTX, PNG, JPG - tối đa 25MB)
        </label>
        {doc?.hasFile && (
          <p className="text-sm text-gray-600 mb-2">Hiện tại: {doc.fileName}</p>
        )}
        <input type="file" accept={ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>

      <label className="flex items-center space-x-2">
        <input type="checkbox" className="rounded" checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        <span className="text-sm font-medium text-gray-700">Đang hiển thị</span>
      </label>

      <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
        <button type="submit" disabled={loading}
          className="bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 disabled:bg-slate-300 transition-all">
          {loading ? 'Đang lưu...' : 'Lưu Tài Liệu'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all">
          Hủy
        </button>
        {doc && canDelete && (
          <button type="button" onClick={handleDelete} disabled={loading}
            className="ml-auto bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all">
            Xóa tài liệu
          </button>
        )}
      </div>
    </form>
  );
}
