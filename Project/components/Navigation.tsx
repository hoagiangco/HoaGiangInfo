'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiMenu, 
  FiX, 
  FiBookOpen, 
  FiMap, 
  FiStar, 
  FiInfo, 
  FiMessageSquare,
  FiAward
} from 'react-icons/fi';
import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import LanguageSwitcher from './LanguageSwitcher';
import { getTranslation } from '@/lib/i18n';

interface NavigationProps {
  token: string;
  allowedModules: string[];
}

const moduleRoutes: Record<string, { path: string; labelKey: string; icon: React.ComponentType<{ className?: string }> }> = {
  menu: { path: '/menu', labelKey: 'menu', icon: FiBookOpen },
  'floor-plan': { path: '/floor-plan', labelKey: 'floor_plan', icon: FiMap },
  services: { path: '/services', labelKey: 'services', icon: FiStar },
  information: { path: '/information', labelKey: 'information', icon: FiInfo },
};

// Feedback is available to every valid guest QR code (not a DB module).
const feedbackRoute = { path: '/feedback', labelKey: 'feedback', icon: FiMessageSquare };

export default function Navigation({ token, allowedModules }: NavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language } = useLanguage();

  const availableRoutes = [
    ...allowedModules.map((mod) => moduleRoutes[mod]).filter(Boolean),
    feedbackRoute,
  ];

  return (
    <nav className="luxury-glass sticky top-0 z-50 border-b border-[#EAE2D2] transition-all">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Resort Luxury Logo */}
          <Link
            href={`/${token}`}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FAF5EB] to-[#F1E5CF] border border-[#D7BD81] flex items-center justify-center text-[#866526] shadow-sm group-hover:scale-105 transition-transform">
              <FiAward className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-bold tracking-[0.15em] text-stone-900 group-hover:text-[#866526] transition-colors leading-none">
                HOA GIANG
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#9C752B] font-semibold mt-1">
                Hoa Binh Rach Gia Resort
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            {availableRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === `/${token}${route.path}` || 
                              (route.path === '/floor-plan' && pathname?.includes('/floor-plan'));
              return (
                <Link
                  key={route.path}
                  href={`/${token}${route.path}`}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white shadow-md shadow-[#866526]/20'
                      : 'text-stone-600 hover:text-[#866526] hover:bg-[#FAF7EE]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#A38035]'}`} />
                  <span>{getTranslation(language, route.labelKey)}</span>
                </Link>
              );
            })}

            <div className="pl-3 ml-2 border-l border-[#EAE2D2]">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Menu & Language Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-full bg-[#FAF7EE] text-[#866526] hover:bg-[#F4EBD4] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#EAE2D2] animate-in fade-in duration-200">
            <div className="flex flex-col space-y-1.5">
              {availableRoutes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === `/${token}${route.path}` || 
                                (route.path === '/floor-plan' && pathname?.includes('/floor-plan'));
                return (
                  <Link
                    key={route.path}
                    href={`/${token}${route.path}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white shadow-sm'
                        : 'text-stone-700 hover:bg-[#FAF7EE] hover:text-[#866526]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#A38035]" />
                    <span>{getTranslation(language, route.labelKey)}</span>
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
