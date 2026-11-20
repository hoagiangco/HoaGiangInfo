'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ModuleCard from '@/components/ModuleCard';
import { useLanguage } from '@/components/LanguageProvider';
import { getTranslation } from '@/lib/i18n';
import Loading from '@/components/Loading';
import { FiPhoneCall, FiClock, FiShield } from 'react-icons/fi';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string;
}

export default function TokenHome() {
  const params = useParams();
  const token = params.token as string;
  const { language } = useLanguage();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/qr/verify/${token}`);
        if (!response.ok) throw new Error('Invalid QR code');
        const qrInfo = await response.json();

        const modulesResponse = await fetch('/api/modules');
        const allModules = await modulesResponse.json();
        const allowedModules = allModules.filter((m: Module) =>
          qrInfo.modules.includes(m.name)
        );
        setModules(allowedModules);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Luxury Hero Banner */}
      <section className="text-center relative pt-4 pb-2">
        {/* 4 Golden Stars badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FAF7EE] border border-[#E6D3A7] text-[#A38035] text-xs font-semibold tracking-[0.25em] uppercase mb-5 shadow-sm">
          <span>★ ★ ★ ★</span>
          <span className="text-[10px] text-[#684B1B] ml-1 font-bold">4-STAR RESORT</span>
        </div>

        {/* Big Serif Welcome Headline */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-stone-900 tracking-tight leading-tight max-w-3xl mx-auto mb-4">
          Chào Mừng Quý Khách Đến Với Hòa Bình Rạch Giá Resort
        </h1>

        {/* Elegant Subtitle */}
        <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Tận hưởng không gian nghỉ dưỡng tuyệt mỹ, khám phá ẩm thực tinh tế và các tiện ích đặc quyền chuẩn 4 sao quốc tế
        </p>

        {/* Decorative divider */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
          <span className="w-1.5 h-1.5 rotate-45 bg-[#B58E38]" />
          <span className="h-[1px] w-12 bg-[#E6D3A7]" />
        </div>
      </section>

      {/* Grid of Luxury Modules */}
      <section>
        {modules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-luxury p-12 text-center border border-[#EBDDC3]">
            <p className="font-serif text-lg text-stone-700">
              {getTranslation(language, 'no_modules')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} token={token} />
            ))}

            {/* Seamless Guest Feedback card in the same luxury grid */}
            <ModuleCard
              token={token}
              module={{
                id: 'feedback',
                name: 'feedback',
                displayName: getTranslation(language, 'feedback') || 'Góp Ý & Đánh Giá',
                description: 'Ý kiến của Quý khách là kim chỉ nam giúp chúng tôi nâng tầm chất lượng dịch vụ mỗi ngày',
                icon: null,
                route: '/feedback',
              }}
            />
          </div>
        )}
      </section>

      {/* Quick Concierge & Assistance Bar */}
      <section className="bg-gradient-to-r from-[#FAF7EE] via-[#F4EBD4] to-[#FAF7EE] rounded-2xl border border-[#E6D3A7] p-6 lg:p-8 text-stone-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white text-[#866526] border border-[#D7BD81] flex items-center justify-center shrink-0 shadow-sm">
              <FiPhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold text-stone-900">
                Cần Hỗ Trợ Trực Tiếp?
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                Đội ngũ Quản gia & Lễ tân luôn sẵn sàng hỗ trợ Quý khách 24/7
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-stone-700">
            <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-lg border border-[#E6D3A7]/60">
              <FiPhoneCall className="text-[#866526]" />
              <span>Bấm phím <strong>100</strong> (Lễ tân)</span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-lg border border-[#E6D3A7]/60">
              <FiClock className="text-[#866526]" />
              <span>Dịch vụ phòng: <strong>24/24</strong></span>
            </div>
            <div className="flex items-center gap-2 bg-white/70 px-4 py-2 rounded-lg border border-[#E6D3A7]/60">
              <FiShield className="text-[#866526]" />
              <span>An ninh & Y tế hỗ trợ ngay</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
