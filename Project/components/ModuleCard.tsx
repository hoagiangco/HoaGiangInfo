'use client';

import Link from 'next/link';
import { 
  FiBookOpen, 
  FiMap, 
  FiStar, 
  FiInfo, 
  FiMessageSquare, 
  FiArrowRight,
  FiCompass
} from 'react-icons/fi';

interface Module {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  route: string;
}

interface ModuleCardProps {
  module: Module;
  token: string;
}

const moduleMeta: Record<
  string,
  {
    tag: string;
    icon: React.ComponentType<{ className?: string }>;
    fallbackDesc: string;
    bgAccent: string;
  }
> = {
  menu: {
    tag: 'CUISINE & DINING',
    icon: FiBookOpen,
    fallbackDesc: 'Thực đơn món ăn & đồ uống thượng hạng chế biến từ nguyên liệu tươi ngon nhất',
    bgAccent: 'from-amber-500/10 to-transparent',
  },
  'floor-plan': {
    tag: 'RESORT MAP & VILLAS',
    icon: FiMap,
    fallbackDesc: 'Sơ đồ chi tiết toàn khu nghỉ dưỡng, vị trí phòng nghỉ, biệt thự và tiện ích',
    bgAccent: 'from-emerald-500/10 to-transparent',
  },
  services: {
    tag: 'WELLNESS & RELAXATION',
    icon: FiStar,
    fallbackDesc: 'Trải nghiệm spa trị liệu, hồ bơi thư giãn, gym và các dịch vụ chăm sóc cao cấp',
    bgAccent: 'from-sky-500/10 to-transparent',
  },
  information: {
    tag: 'HOTEL INFORMATION',
    icon: FiInfo,
    fallbackDesc: 'Mật khẩu Wi-Fi tốc độ cao, số máy lễ tân, danh mục kênh truyền hình và tiện ích phòng',
    bgAccent: 'from-violet-500/10 to-transparent',
  },
  feedback: {
    tag: 'GUEST EXPERIENCE',
    icon: FiMessageSquare,
    fallbackDesc: 'Chia sẻ đánh giá và cảm nhận của Quý khách để chúng tôi phục vụ ngày một hoàn hảo hơn',
    bgAccent: 'from-rose-500/10 to-transparent',
  },
};

export default function ModuleCard({ module, token }: ModuleCardProps) {
  const meta = moduleMeta[module.name] || {
    tag: 'RESORT SERVICE',
    icon: FiCompass,
    fallbackDesc: module.description || 'Dịch vụ tiện ích cao cấp dành riêng cho Quý khách',
    bgAccent: 'from-gold-500/10 to-transparent',
  };

  const Icon = meta.icon;

  return (
    <Link href={`/${token}${module.route}`} className="group block h-full">
      <div className="relative h-full bg-white rounded-2xl p-7 lg:p-8 border border-[#EBDDC3] shadow-luxury hover:shadow-luxury-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
        {/* Subtle decorative gold light in top corner */}
        <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl ${meta.bgAccent} rounded-bl-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        <div>
          {/* Eyebrow tag & Icon badge */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9C752B] bg-[#FAF7EE] border border-[#E8D8B0] px-3 py-1 rounded-full">
              {meta.tag}
            </span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FAF5EB] to-[#F1E5CF] text-[#866526] border border-[#E0D0B3] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-[#866526] group-hover:text-white transition-all duration-300">
              <Icon className="w-5 h-5 transition-colors" />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif text-2xl font-semibold text-stone-900 mb-2.5 tracking-tight group-hover:text-[#866526] transition-colors">
            {module.displayName}
          </h3>

          {/* Description */}
          <p className="text-stone-600 text-sm leading-relaxed mb-6">
            {module.description || meta.fallbackDesc}
          </p>
        </div>

        {/* CTA link */}
        <div className="pt-4 border-t border-[#F4EBD4] flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-[#866526] group-hover:text-[#684B1B]">
          <span>Khám phá ngay</span>
          <div className="w-7 h-7 rounded-full bg-[#FAF7EE] flex items-center justify-center group-hover:translate-x-1 group-hover:bg-[#866526] group-hover:text-white transition-all">
            <FiArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
