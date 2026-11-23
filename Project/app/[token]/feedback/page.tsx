'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { ft } from '@/lib/feedback-i18n';
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiShield,
  FiSliders,
  FiUser,
} from 'react-icons/fi';

function Stars({
  value,
  onChange,
  size = 'w-11 h-11 text-3xl',
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: string;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1 sm:gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          className={`${size} rounded-xl flex items-center justify-center leading-none transition-all duration-150 active:scale-90 hover:scale-110 ${
            n <= value
              ? 'text-[#C88A12]'
              : 'text-slate-300 hover:text-amber-400'
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
  const [showDetailed, setShowDetailed] = useState(false);
  const [showOptionalInfo, setShowOptionalInfo] = useState(false);
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
      <div className="max-w-lg mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#CFC3AC] p-7 sm:p-10 text-center mt-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto mb-5">
          <FiCheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {t('thanks')}
        </h1>
        <p className="text-slate-700 text-sm leading-relaxed mb-7 max-w-sm mx-auto">
          {t('thanks_sub')}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A] px-6 h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-sm transition-all"
          >
            {t('again')}
          </button>
          <Link
            href={`/${token}`}
            className="inline-flex items-center justify-center px-6 h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-900 bg-[#F3EFE6] border border-[#CFC3AC] hover:border-[#0F172A] transition-all"
          >
            {t('back_home')}
          </Link>
        </div>
      </div>
    );
  }

  const field =
    'w-full px-3.5 py-2.5 border border-[#C9B483] bg-white rounded-xl text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20 focus:border-[#0F172A] transition-all';
  const lbl =
    'block text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-2';

  const detailedCount =
    Object.values(ratings).filter(Boolean).length + (nps !== null ? 1 : 0);
  const optionalInfoCount = [location, guestName, contact].filter((v) =>
    v.trim()
  ).length;

  return (
    <div className="max-w-2xl mx-auto w-full space-y-4">
      {/* Compact High-Contrast Page Header */}
      <div className="flex items-start gap-3 pb-3 border-b border-[#D5C9B2]">
        <Link
          href={`/${token}`}
          aria-label={t('back_home')}
          className="w-10 h-10 rounded-xl bg-white border border-[#CFC3AC] text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] flex items-center justify-center shrink-0 shadow-sm transition-colors active:scale-95 mt-0.5"
        >
          <FiArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
            {t('title')}
          </h1>
          <p className="text-slate-700 text-xs sm:text-sm leading-snug mt-0.5">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-[#CFC3AC] p-4 sm:p-7 space-y-5"
      >
        {/* Step 1: Venue Selection */}
        <div>
          <label className={lbl}>{t('about')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {VENUES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVenue(v)}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all active:scale-[0.98] ${
                  venue === v
                    ? 'bg-[#0F172A] text-[#E8CA7A] border-[#0F172A] shadow-sm'
                    : 'bg-[#F3EFE6]/70 text-slate-900 border-[#CFC3AC] hover:border-[#0F172A]'
                }`}
              >
                {t(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Overall Star Rating — Large, Unmistakable, Instant Feedback */}
        <div className="bg-[#FBF6E8] border border-[#C9B483] rounded-2xl p-4 sm:p-5 text-center">
          <label className="block font-serif text-base sm:text-lg text-slate-900 font-bold mb-2">
            {t('overall')} <span className="text-red-700">*</span>
          </label>
          <div className="flex justify-center">
            <Stars
              value={overall}
              onChange={(v) => {
                setOverall(v);
                if (error) setError('');
              }}
              size="w-12 h-12 text-4xl"
              label={t('overall')}
            />
          </div>
          {overall > 0 && (
            <p className="mt-2 inline-flex items-center px-3 py-0.5 rounded-full bg-[#0F172A] text-[#E8CA7A] text-xs font-bold">
              {overall}/5 · {t(`rating_${overall}`)}
            </p>
          )}
        </div>

        {/* Step 3: Comment */}
        <div>
          <label className={lbl}>{t('comment')}</label>
          <textarea
            className={field}
            rows={3}
            maxLength={2000}
            placeholder={t('comment_placeholder')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* Optional Collapsible Section 1: Detailed Criteria & NPS */}
        <div className="rounded-2xl border border-[#CFC3AC] bg-[#F3EFE6]/45 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetailed((prev) => !prev)}
            aria-expanded={showDetailed}
            className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[#F3EFE6] transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <FiSliders className="w-4 h-4 text-[#6E4E12] shrink-0" />
              <span>{t('optional_details_toggle')}</span>
              {detailedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#0F172A] text-[#E8CA7A] text-[10.5px] font-bold">
                  {detailedCount}
                </span>
              )}
            </span>
            <FiChevronDown
              className={`w-4 h-4 text-slate-700 shrink-0 transition-transform duration-200 ${
                showDetailed ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showDetailed && (
            <div className="px-4 pb-4 pt-2 space-y-5 border-t border-[#D5C9B2] bg-white">
              {/* Detailed Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CRITERIA.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F3EFE6]/60 border border-[#D5C9B2]"
                  >
                    <span className="text-xs font-bold text-slate-900">
                      {t(c)}
                    </span>
                    <Stars
                      value={ratings[c] ?? 0}
                      onChange={(v) => setRatings((r) => ({ ...r, [c]: v }))}
                      size="w-8 h-8 text-xl"
                      label={t(c)}
                    />
                  </div>
                ))}
              </div>

              {/* Balanced NPS 0-10 Grid */}
              <div>
                <label className={lbl}>{t('nps')}</label>
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNps(i)}
                      className={`h-10 rounded-xl border text-xs font-extrabold transition-all active:scale-95 ${
                        nps === i
                          ? 'bg-[#0F172A] text-[#E8CA7A] border-[#0F172A] shadow-sm'
                          : 'bg-[#F3EFE6]/60 text-slate-900 border-[#CFC3AC] hover:border-[#0F172A]'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-1.5">
                  <span>0 · {t('nps_low')}</span>
                  <span>10 · {t('nps_high')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optional Collapsible Section 2: Room / Name / Contact */}
        <div className="rounded-2xl border border-[#CFC3AC] bg-[#F3EFE6]/45 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptionalInfo((prev) => !prev)}
            aria-expanded={showOptionalInfo}
            className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[#F3EFE6] transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <FiUser className="w-4 h-4 text-[#6E4E12] shrink-0" />
              <span>{t('optional_info_toggle')}</span>
              {optionalInfoCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#0F172A] text-[#E8CA7A] text-[10.5px] font-bold">
                  {optionalInfoCount}
                </span>
              )}
            </span>
            <FiChevronDown
              className={`w-4 h-4 text-slate-700 shrink-0 transition-transform duration-200 ${
                showOptionalInfo ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showOptionalInfo && (
            <div className="px-4 pb-4 pt-3 space-y-3.5 border-t border-[#D5C9B2] bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>{t('location')}</label>
                  <input
                    className={field}
                    maxLength={40}
                    placeholder={t('location_placeholder')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className={lbl}>{t('name')}</label>
                  <input
                    className={field}
                    maxLength={100}
                    placeholder={t('name_placeholder')}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>{t('contact')}</label>
                <input
                  className={field}
                  maxLength={120}
                  placeholder={t('contact_placeholder')}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
                <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-2">
                  <FiShield className="w-3.5 h-3.5 text-[#6E4E12] shrink-0 mt-0.5" />
                  <span>{t('privacy')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Honeypot: hidden from humans */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: 1,
            height: 1,
            overflow: 'hidden',
          }}
        >
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-900 font-semibold text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full h-12 bg-[#0F172A] hover:bg-slate-800 text-[#E8CA7A] rounded-xl text-xs font-extrabold uppercase tracking-[0.18em] shadow-md disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
        >
          {status === 'sending' ? t('sending') : t('submit')}
        </button>
      </form>
    </div>
  );
}
