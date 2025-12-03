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
  FiBookOpen
} from 'react-icons/fi';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: FiHome },
    { href: '/admin/qr-codes', label: 'QR Codes', icon: FiBox },
    { href: '/admin/modules', label: 'Modules', icon: FiGrid },
    { href: '/admin/menu', label: 'Menu', icon: FiMenu },
    { href: '/admin/flipbooks', label: 'Flipbooks', icon: FiBookOpen },
    { href: '/admin/services', label: 'Services', icon: FiBriefcase },
    { href: '/admin/information', label: 'Information', icon: FiInfo },
    { href: '/admin/floor-plans', label: 'Floor Plans', icon: FiMap },
    { href: '/admin/technical-documents', label: 'Documents', icon: FiFileText },
    { href: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
    { href: '/admin/export-import', label: 'Export/Import', icon: FiDownload },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          if (!Icon) {
            console.error(`Icon not found for ${item.label}`);
            return null;
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-6 py-3 hover:bg-gray-700 ${
                isActive ? 'bg-gray-700 border-l-4 border-primary-500' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-0 w-full p-6">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-6 py-3 hover:bg-gray-700 rounded"
        >
          <FiLogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

