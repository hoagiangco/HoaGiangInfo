'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiMenu } from 'react-icons/fi';
import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { getTranslation } from '@/lib/i18n';

interface NavigationProps {
  token: string;
  allowedModules: string[];
}

const moduleRoutes: Record<string, { path: string; labelKey: string; icon: string }> = {
  menu: { path: '/menu', labelKey: 'menu', icon: '🍽️' },
  'floor-plan': { path: '/floor-plan', labelKey: 'floor_plan', icon: '🗺️' },
  services: { path: '/services', labelKey: 'services', icon: '🏊' },
  information: { path: '/information', labelKey: 'information', icon: 'ℹ️' },
  technical: { path: '/technical', labelKey: 'technical', icon: '📋' },
};

export default function Navigation({ token, allowedModules }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language } = useLanguage();

  const availableRoutes = allowedModules
    .map((mod) => moduleRoutes[mod])
    .filter(Boolean);

  return (
    <nav className="bg-white shadow-md mb-0 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`/${token}`}
            className="flex items-center space-x-2 text-xl font-bold text-primary-600"
          >
            <FiHome className="w-6 h-6" />
            <span>{getTranslation(language, 'resort_info')}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {availableRoutes.map((route) => {
              const isActive = pathname === `/${token}${route.path}` || 
                              (route.path === '/floor-plan' && pathname?.includes('/floor-plan'));
              return (
                <Link
                  key={route.path}
                  href={`/${token}${route.path}`}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{route.icon}</span>
                  {getTranslation(language, route.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2 mt-2">
              {availableRoutes.map((route) => {
                const isActive = pathname === `/${token}${route.path}` || 
                                (route.path === '/floor-plan' && pathname?.includes('/floor-plan'));
                return (
                  <Link
                    key={route.path}
                    href={`/${token}${route.path}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{route.icon}</span>
                    {getTranslation(language, route.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

