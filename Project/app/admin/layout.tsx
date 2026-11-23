import AdminSidebar from '@/components/AdminSidebar';
import { requireUser } from '@/lib/auth/guard';
import { permissionsOf } from '@/lib/auth/permissions';
import { getFooterConfig } from '@/lib/footer-server';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Every page under /admin requires a valid server-side session.
  const [user, footerConfig] = await Promise.all([
    requireUser(),
    getFooterConfig(),
  ]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      <AdminSidebar
        user={{ name: user.name, email: user.email, role: user.role }}
        permissions={permissionsOf(user.role)}
        branding={footerConfig.branding}
      />
      <div className="ml-72 min-h-screen flex flex-col">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Hòa Bình Rạch Giá Resort</span>
            <span>/</span>
            <span className="text-[#866526] font-medium">Hệ thống quản trị & nội bộ</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-500 hidden sm:inline">
              Phiên đăng nhập: <strong className="text-slate-700">{user.email}</strong>
            </span>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:inline" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Bảo mật đa cấp
            </span>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
