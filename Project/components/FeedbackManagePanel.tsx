'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/lib/feedback';
import AdminDeleteButton from './AdminDeleteButton';

interface Props {
  id: string;
  status: string;
  assigneeId: string | null;
  canAssign: boolean;
  users: { id: string; name: string; role: string }[];
}

export default function FeedbackManagePanel({ id, status, assigneeId, canAssign, users }: Props) {
  const router = useRouter();
  const [st, setSt] = useState(status);
  const [assignee, setAssignee] = useState(assigneeId ?? '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setLoading(true);
    setError('');
    const body: Record<string, unknown> = {};
    if (st !== status) body.status = st;
    if (canAssign && assignee !== (assigneeId ?? '')) body.assigneeId = assignee || null;
    if (note.trim()) body.note = note.trim();

    const res = await fetch(`/api/internal/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNote('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Không lưu được');
    }
    setLoading(false);
  }

  const field = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm';
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="font-semibold text-gray-800">Xử lý</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Trạng thái</label>
        <select className={field} value={st} onChange={(e) => setSt(e.target.value)}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {canAssign && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">Giao cho</label>
          <select className={field} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">— Chưa giao —</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Ghi chú nội bộ</label>
        <textarea className={field} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
        <button onClick={save} disabled={loading} className="bg-primary-600 text-white px-5 py-2 rounded-lg disabled:bg-gray-400">
          {loading ? 'Đang lưu...' : 'Lưu'}
        </button>
        {canAssign && (
          <AdminDeleteButton
            endpoint={`/api/internal/feedback/${id}`}
            itemName={`phản hồi #${id.slice(-6)}`}
            entityLabel="phản hồi"
            redirectTo="/admin/feedback"
            variant="table"
            buttonLabel="Xóa phản hồi"
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
