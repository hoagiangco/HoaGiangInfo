'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS, ROLES, ROLE_LABELS, canManageRole, type Role } from '@/lib/auth/permissions';
import { FiUserPlus, FiKey, FiLock, FiUnlock } from 'react-icons/fi';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
}

export default function UsersManager({ users, actorRole, actorId }: { users: UserRow[]; actorRole: Role; actorId: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const assignable = ROLES.filter((r) => canManageRole(actorRole, r));
  const [form, setForm] = useState({
    email: '', name: '', role: (assignable[assignable.length - 1] ?? 'STAFF') as Role, department: '', password: '',
  });

  async function call(url: string, method: string, body: unknown) {
    setBusy(true);
    setError('');
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Thao tác thất bại');
      return false;
    }
    router.refresh();
    return true;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call('/api/internal/users', 'POST', { ...form, department: form.department || null });
    if (ok) setForm({ ...form, email: '', name: '', password: '' });
  }

  async function resetPassword(u: UserRow) {
    const pw = prompt(`Mật khẩu mới cho ${u.email} (≥10 ký tự, gồm chữ hoa, thường, số):`);
    if (pw) await call(`/api/internal/users/${u.id}`, 'PATCH', { password: pw });
  }

  const field = 'px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 w-full focus:outline-none focus:ring-2 focus:ring-[#866526]/20 focus:border-[#866526] transition-all';
  const label = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5';

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Create User Form */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-6 lg:p-7">
        <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] flex items-center justify-center text-xs">
            <FiUserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-slate-900">
              Cấp Tài Khoản Nhân Viên Mới
            </h3>
            <p className="text-xs text-slate-500">Phân quyền vai trò và phòng ban phụ trách</p>
          </div>
        </div>

        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-2">
            <label className={label}>Email Đăng Nhập *</label>
            <input className={field} type="email" placeholder="staff@hoagiang.vn" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className={label}>Họ Và Tên *</label>
            <input className={field} placeholder="Nguyễn Văn A" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={label}>Vai Trò (Role) *</label>
            <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Phòng Ban</label>
            <select className={field} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">— Chung —</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Mật Khẩu Ban Đầu *</label>
            <input className={field} type="password" autoComplete="new-password" placeholder="≥10 ký tự" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          <div className="md:col-span-6 pt-2">
            <button
              disabled={busy}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] hover:from-[#866526] hover:to-[#684B1B] text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 disabled:bg-slate-300 transition-all"
            >
              <FiUserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-slate-900">
            Danh Sách Nhân Viên & Cấp Bậc
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {users.length} tài khoản
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nhân Viên</th>
                <th className="px-6 py-4">Vai Trò</th>
                <th className="px-6 py-4">Phòng Ban</th>
                <th className="px-6 py-4">Đăng Nhập Gần Nhất</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => {
                const editable = canManageRole(actorRole, u.role);
                const isSelf = u.id === actorId;
                return (
                  <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {editable && !isSelf ? (
                        <select
                          disabled={busy}
                          value={u.role}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800"
                          onChange={(e) => call(`/api/internal/users/${u.id}`, 'PATCH', { role: e.target.value })}
                        >
                          {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7]">
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {editable && !isSelf ? (
                        <select
                          disabled={busy}
                          value={u.department ?? ''}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700"
                          onChange={(e) => call(`/api/internal/users/${u.id}`, 'PATCH', { department: e.target.value || null })}
                        >
                          <option value="">— Chung —</option>
                          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-600">{u.department || '—'}</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : 'Chưa từng'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{u.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {editable && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => resetPassword(u)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#866526] bg-[#FAF7EE] hover:bg-[#F4EBD4] border border-[#E6D3A7] transition-all"
                            title="Đặt lại mật khẩu"
                          >
                            <FiKey className="w-3.5 h-3.5" />
                            <span>Đổi pass</span>
                          </button>
                          {!isSelf && (
                            <button
                              disabled={busy}
                              onClick={() => call(`/api/internal/users/${u.id}`, 'PATCH', { isActive: !u.isActive })}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                u.isActive
                                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {u.isActive ? <FiLock className="w-3.5 h-3.5" /> : <FiUnlock className="w-3.5 h-3.5" />}
                              <span>{u.isActive ? 'Khóa' : 'Mở'}</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
