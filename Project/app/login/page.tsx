'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiAward, FiLock, FiMail, FiArrowRight } from 'react-icons/fi';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const next = searchParams.get('next');
        const target =
          next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
        window.location.assign(target);
        return;
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Email hoặc mật khẩu không đúng');
      }
    } catch {
      setError('Có lỗi xảy ra trong quá trình đăng nhập');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] px-4 relative overflow-hidden">
      {/* Subtle gold glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-b from-[#C5A456]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[#111A2C] border border-[#223147] rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md relative z-10 text-white">
        {/* Emblem & Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B58E38] to-[#866526] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#866526]/25 border border-[#D7BD81]/30">
            <FiAward className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C5A456]">
            HÒA BÌNH RẠCH GIÁ RESORT
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
            Cổng Thông Tin Nội Bộ
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Hệ thống quản trị và vận hành dịch vụ 4 sao. Vui lòng đăng nhập tài khoản được cấp.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Nhân Viên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiMail className="w-4 h-4" />
              </div>
              <input
                type="email"
                id="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hoagiang.vn"
                className="w-full pl-10 pr-4 py-3 bg-[#18243A] border border-[#2A3C59] text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A456]/30 focus:border-[#C5A456] transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Mật Khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FiLock className="w-4 h-4" />
              </div>
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-[#18243A] border border-[#2A3C59] text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A456]/30 focus:border-[#C5A456] transition-all"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-4 py-3 rounded-xl animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#B58E38] to-[#866526] hover:from-[#9C752B] hover:to-[#6E511B] text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-[#866526]/25 disabled:bg-slate-700 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 mt-6"
          >
            <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Hệ Thống'}</span>
            {!loading && <FiArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1E293B] text-center text-[11px] text-slate-500">
          <p>Bảo mật nhiều lớp · Mọi hành động đều được ghi log kiểm toán</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
