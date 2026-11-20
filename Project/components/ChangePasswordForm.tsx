'use client';

import { useState } from 'react';

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setCurrent('');
      setNext('');
      setMsg({ ok: true, text: 'Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.' });
    } else {
      setMsg({ ok: false, text: data.error || 'Không đổi được mật khẩu' });
    }
  }

  const field = 'w-full px-4 py-2 border border-gray-300 rounded-lg';
  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-6 space-y-4 max-w-md">
      <h2 className="font-semibold text-gray-800">Đổi mật khẩu</h2>
      {msg && (
        <div className={`px-3 py-2 rounded text-sm border ${msg.ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {msg.text}
        </div>
      )}
      <input className={field} type="password" autoComplete="current-password" placeholder="Mật khẩu hiện tại" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      <input className={field} type="password" autoComplete="new-password" placeholder="Mật khẩu mới (≥10 ký tự, chữ hoa, thường, số)" required value={next} onChange={(e) => setNext(e.target.value)} />
      <button disabled={loading} className="bg-primary-600 text-white px-5 py-2 rounded-lg disabled:bg-gray-400">
        {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
      </button>
    </form>
  );
}
