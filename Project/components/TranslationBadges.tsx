import { FiGlobe } from 'react-icons/fi';
import { languages, languageShortLabels, type Language } from '@/lib/i18n';

interface TranslationBadgesProps {
  availableLangs: Language[];
  showMissing?: boolean;
}

export default function TranslationBadges({
  availableLangs,
  showMissing = true,
}: TranslationBadgesProps) {
  const list = showMissing ? languages : availableLangs;

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      <FiGlobe className="w-3 h-3 text-slate-400 mr-0.5" />
      {list.map((lang) => {
        const hasLang = availableLangs.includes(lang);
        return (
          <span
            key={lang}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              hasLang
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={
              hasLang
                ? `Đã có nội dung ${languageShortLabels[lang]}`
                : `Chưa có bản dịch ${languageShortLabels[lang]}`
            }
          >
            {languageShortLabels[lang]}
          </span>
        );
      })}
    </div>
  );
}
