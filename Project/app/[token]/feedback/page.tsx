'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { ft } from '@/lib/feedback-i18n';
import { FiCheckCircle, FiHeart, FiShield, FiStar } from 'react-icons/fi';

function Stars({
  value,
  onChange,
  size = 'text-3xl',
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          className={`${size} leading-none transition-all duration-150 active:scale-90 hover:scale-110 ${
            n <= value ? 'text-[#B58E38] drop-shadow-sm' : 'text-[#E6D3A7]/50 hover:text-[#E6D3A7]'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const CRITERIA = ['service', 'food', 'cleanliness', 'value'] as const;
const VENUES = ['hotel', 'restaurant', 'spa', 'other'] as const;

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;
  const { language } = useLanguage();
  const t = (k: string) => ft(language, k);

  const [venue, setVenue] = useState<(typeof VENUES)[number]>('hotel');
  const [overall, setOverall] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const [guestName, setGuestName] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  function reset() {
    setOverall(0);
    setRatings({});
    setNps(null);
    setComment('');
    setLocation('');
    setGuestName('');
    setContact('');
    setError('');
    setStatus('idle');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (overall < 1) {
      setError(t('need_rating'));
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          venue,
          location: location || undefined,
          overallRating: overall,
          ratings: Object.keys(ratings).length ? ratings : undefined,
          npsScore: nps ?? undefined,
          comment: comment || undefined,
          guestName: guestName || undefined,
          contact: contact || undefined,
          language,
          website,
        }),
      });
      if (res.ok) {
        setStatus('done');
      } else {
        setError(res.status === 429 ? t('too_many') : t('error'));
        setStatus('idle');
      }
    } catch {
      setError(t('error'));
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-luxury border border-[#EBDDC3] p-10 lg:p-12 text-center mt-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-[#FAF7EE] border border-[#D7BD81] text-[#866526] flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm">
          <FiCheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-medium text-stone-900 mb-3">{t('thanks')}</h1>
        <p className="text-stone-600 text-sm leading-relaxed mb-8 max-w-sm mx-auto">{t('thanks_sub')}</p>
        <button 
          onClick={reset} 
          className="bg-gradient-to-r from-[#A38035] to-[#866526] text-white px-8 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md shadow-[#866526]/20 hover:from-[#866526] hover:to-[#684B1B] transition-all"
        >
          {t('again')}
        </button>
      </div>
    );
  }

  const field = 'w-full px-4 py-3 border border-[#E6D3A7] bg-[#FAF7EE]/30 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#866526]/30 focus:border-[#866526] transition-all';
  const lbl = 'block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2';

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={submit} className="bg-white rounded-3xl shadow-luxury border border-[#EBDDC3] p-8 lg:p-10 space-y-8">
        {/* Header */}
        <div className="text-center pb-6 border-b border-[#F4EBD4]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF7EE] text-[#866526] text-[10px] font-bold uppercase tracking-[0.2em] mb-3 border border-[#E8D8B0]">
            <FiHeart className="w-3 h-3" />
            <span>GUEST EXPERIENCE FEEDBACK</span>
          </div>
          <h1 className="font-serif text-3xl font-medium text-stone-900 mb-2">{t('title')}</h1>
          <p className="text-stone-500 text-sm max-w-md mx-auto">{t('subtitle')}</p>
        </div>

        {/* Venue Selection */}
        <div>
          <label className={lbl}>{t('about')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {VENUES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVenue(v)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition-all ${
                  venue === v 
                    ? 'bg-gradient-to-r from-[#A38035] to-[#866526] text-white border-transparent shadow-sm' 
                    : 'bg-[#FAF7EE]/50 text-stone-600 border-[#E6D3A7] hover:bg-[#FAF7EE] hover:text-[#866526]'
                }`}
              >
                {t(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-[#FAF7EE]/50 border border-[#E6D3A7] rounded-2xl p-6 text-center">
          <label className="block font-serif text-lg text-stone-900 font-medium mb-3">
            {t('overall')} <span className="text-[#866526]">*</span>
          </label>
          <div className="flex justify-center">
            <Stars value={overall} onChange={setOverall} size="text-4xl" label={t('overall')} />
          </div>
        </div>

        {/* Detailed Criteria */}
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#866526]">Đánh giá theo từng tiêu chí</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CRITERIA.map((c) => (
              <div key={c} className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7EE]/40 border border-[#E6D3A7]/60">
                <span className="text-xs font-semibold text-stone-700">{t(c)}</span>
                <Stars
                  value={ratings[c] ?? 0}
                  onChange={(v) => setRatings((r) => ({ ...r, [c]: v }))}
                  size="text-xl"
                  label={t(c)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* NPS */}
        <div>
          <label className={lbl}>{t('nps')}</label>
          <div className="flex flex-wrap gap-1.5 justify-between">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNps(i)}
                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all ${
                  nps === i 
                    ? 'bg-[#866526] text-white border-[#866526] shadow-sm scale-105' 
                    : 'bg-[#FAF7EE]/40 text-stone-600 border-[#E6D3A7] hover:bg-[#FAF7EE] hover:border-[#B58E38]'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className={lbl}>{t('comment')}</label>
          <textarea 
            className={field} 
            rows={4} 
            maxLength={2000} 
            placeholder="Chia sẻ thêm cảm nhận hoặc đóng góp của Quý khách..."
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
          />
        </div>

        {/* Location & Guest info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>{t('location')}</label>
            <input className={field} maxLength={40} placeholder="Ví dụ: Phòng 302, Bàn 12" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className={lbl}>{t('name')}</label>
            <input className={field} maxLength={100} placeholder="Họ và tên" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={lbl}>{t('contact')}</label>
          <input className={field} maxLength={120} placeholder="Số điện thoại hoặc email" value={contact} onChange={(e) => setContact(e.target.value)} />
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-2">
            <FiShield className="w-3.5 h-3.5 text-[#866526] shrink-0" />
            <span>{t('privacy')}</span>
          </div>
        </div>

        {/* Honeypot: hidden from humans */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-gradient-to-r from-[#A38035] to-[#866526] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-[#866526]/20 hover:from-[#866526] hover:to-[#684B1B] disabled:bg-stone-300 disabled:cursor-not-allowed transition-all"
        >
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
      </form>
    </div>
  );
}
