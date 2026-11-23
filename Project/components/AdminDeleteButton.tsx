'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

export interface AdminDeleteButtonProps {
  endpoint: string;
  itemName: string;
  entityLabel: string;
  warningNote?: string;
  redirectTo?: string;
  variant?: 'table' | 'card' | 'form';
  buttonLabel?: string;
  disabled?: boolean;
  className?: string;
}

export default function AdminDeleteButton({
  endpoint,
  itemName,
  entityLabel,
  warningNote,
  redirectTo,
  variant = 'table',
  buttonLabel,
  disabled = false,
  className = '',
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, deleting]);

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Không thể xóa ${entityLabel}`);
      }

      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || `Có lỗi xảy ra khi xóa ${entityLabel}`);
      setDeleting(false);
    }
  }

  const label =
    buttonLabel ?? (variant === 'form' ? `Xóa ${entityLabel}` : 'Xóa');

  const triggerClasses =
    variant === 'form'
      ? 'inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50'
      : variant === 'card'
      ? 'inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all disabled:opacity-50'
      : 'inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50';

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={(e) => {
              e.stopPropagation();
              if (!deleting) setOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                      <FiAlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-slate-900">
                        Xác nhận xóa {entityLabel}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hành động này không thể hoàn tác
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    aria-label="Đóng"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-slate-700 leading-relaxed">
                  Bạn có chắc chắn muốn xóa {entityLabel}{' '}
                  <strong className="text-slate-900">&ldquo;{itemName}&rdquo;</strong>?
                </div>

                {warningNote && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    {warningNote}
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors disabled:opacity-50"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        disabled={disabled || deleting}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          setOpen(true);
        }}
        title={`Xóa ${entityLabel}`}
        className={`${triggerClasses} ${className}`}
      >
        <FiTrash2 className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
      {modal}
    </>
  );
}
