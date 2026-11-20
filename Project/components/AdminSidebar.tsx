'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHome,
  FiGrid,
  FiMenu,
  FiBriefcase,
  FiInfo,
  FiFileText,
  FiLogOut,
  FiBarChart2,
  FiDownload,
  FiBox,
  FiMap,
  FiBookOpen,
  FiMessageSquare,
  FiUsers,
  FiShield,
  FiKey,
  FiAward,
  FiExternalLink
} from 'react-icons/fi';
import { ROLE_LABELS, type Permission, type Role } from '@/lib/auth/permissions';

interface AdminSidebarProps {
  user: { name: string; email: string; role: Role };
  permissions: Permission[];
}

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  anyOf: Permission[];
}

interface Section {
  title: string;
  items: Item[];
}

const sections: Section[] = [
  {
    title: 'Nghiệp vụ nội bộ',
    items: [
      { href: '/admin', label: 'Dashboard Tổng Quan', icon: FiHome, anyOf: [] },
      { href: '/admin/documents', label: 'Kho Tài Liệu Nội Bộ', icon: FiFileText, anyOf: ['documents.read'] },
      { href: '/admin/feedback', label: 'Hộp Thư Phản Hồi Khách', icon: FiMessageSquare, anyOf: ['feedback.read', 'feedback.read.assigned'] },
      { href: '/admin/analytics', label: 'Thống Kê & Lượt Xem', icon: FiBarChart2, anyOf: ['analytics.view'] },
    ],
  },
  {
    title: 'Quản trị nội dung (CMS)',
    items: [
      { href: '/admin/qr-codes', label: 'Quản Lý Mã QR', icon: FiBox, anyOf: ['content.manage'] },
      { href: '/admin/modules', label: 'Cấu Hình Modules', icon: FiGrid, anyOf: ['content.manage'] },
      { href: '/admin/menu', label: 'Thực Đơn Nhà Hàng', icon: FiMenu, anyOf: ['content.manage'] },
      { href: '/admin/flipbooks', label: 'Flipbook & E-Brochure', icon: FiBookOpen, anyOf: ['content.manage'] },
      { href: '/admin/services', label: 'Dịch Vụ & Tiện Ích', icon: FiBriefcase, anyOf: ['content.manage'] },
      { href: '/admin/information', label: 'Thông Tin Hướng Dẫn', icon: FiInfo, anyOf: ['content.manage'] },
      { href: '/admin/floor-plans', label: 'Sơ Đồ Phòng & Khu Vực', icon: FiMap, anyOf: ['content.manage'] },
      { href: '/admin/export-import', label: 'Sao Lưu & Xuất Dữ Liệu', icon: FiDownload, anyOf: ['content.manage'] },
    ],
  },
  {
    title: 'Hệ thống & Tài khoản',
    items: [
      { href: '/admin/users', label: 'Quản Lý Nhân Viên', icon: FiUsers, anyOf: ['users.manage'] },
      { href: '/admin/audit', label: 'Nhật Ký Truy Cập', icon: FiShield, anyOf: ['audit.view'] },
      { href: '/admin/account', label: 'Hồ Sơ Của Tôi', icon: FiKey, anyOf: [] },
    ],
  },
];

export default function AdminSidebar({ user, permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const can = (item: Item) =>
    item.anyOf.length === 0 || item.anyOf.some((p) => permissions.includes(p));

  // Initials for avatar
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'HG';

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-[#0B1120] text-slate-200 shadow-sidebar flex flex-col z-40 border-r border-[#1E293B]">
      {/* Brand Header */}
      <div className="p-6 pb-5 border-b border-[#1E293B]/80 bg-[#0F172A]/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B58E38] to-[#866526] text-white flex items-center justify-center shadow-md shadow-[#866526]/20 shrink-0">
            <FiAward className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold tracking-[0.15em] text-[#FAF7EE] leading-none">
              HOA GIANG
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#C5A456] font-semibold mt-1">
              Hoa Binh Rach Gia Resort
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="mt-5 p-3 rounded-xl bg-[#151F32] border border-[#223147] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#FAF7EE] text-[#866526] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E6D3A7]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate" title={user.name}>
              {user.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-[#C5A456] font-medium tracking-wide">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => {
          const items = section.items.filter(can);
          if (items.length === 0) return null;
          return (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] uppercase font-bold tracking-[0.22em] text-[#9C752B]">
                {section.title}
              </p>
              <div className="space-y-0.5 pt-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#A38035]/25 via-[#A38035]/10 to-transparent border-l-4 border-[#C5A456] text-[#FAF7EE] font-semibold'
                          : 'text-slate-400 hover:text-[#FAF7EE] hover:bg-[#151F32]/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#C5A456]' : 'text-slate-500 group-hover:text-[#C5A456]'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#1E293B] bg-[#0F172A]/40 space-y-1">
        <Link
          href="/guest"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 text-xs text-slate-400 hover:text-[#E6D3A7] hover:bg-[#151F32] rounded-xl transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <FiExternalLink className="w-3.5 h-3.5 text-[#C5A456]" />
            <span>Mở Trang Khách Hàng</span>
          </div>
          <span className="text-[10px] bg-[#223147] text-slate-300 px-1.5 py-0.5 rounded">QR View</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
        >
          <FiLogOut className="w-3.5 h-3.5" />
          <span>Đăng xuất hệ thống</span>
        </button>
      </div>
    </div>
  );
}
