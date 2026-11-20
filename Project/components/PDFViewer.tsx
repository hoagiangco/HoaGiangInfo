'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
  FiBookOpen,
  FiFile,
  FiMaximize,
  FiMinimize,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';
import {
  computeViewerSizing,
  useOuterViewportMetrics,
  PageLayoutPreference,
  FitPreference,
} from '@/lib/viewer-sizing';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Match worker version exactly with react-pdf's bundled pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.${pdfjs.version}.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  title?: string;
  docLang?: 'vi' | 'en';
  onChangeDocLang?: (lang: 'vi' | 'en') => void;
}

export default function PDFViewer({
  fileUrl,
  fileName,
  title,
  docLang,
  onChangeDocLang,
}: PDFViewerProps) {
  const { language } = useLanguage();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageAspect, setPageAspect] = useState<number>(0.71);
  const [baseRotate, setBaseRotate] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [layoutPref, setLayoutPref] = useState<PageLayoutPreference>('auto');
  const [fitPref, setFitPref] = useState<FitPreference>('readable');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useNativeFallback, setUseNativeFallback] = useState(false);

  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const { availWidth, viewportWidth, viewportHeight } = useOuterViewportMetrics(outerRef);

  const sizing = computeViewerSizing({
    availWidth,
    viewportWidth,
    viewportHeight,
    totalPages: numPages ?? 1,
    pageAspect,
    rotation,
    layoutPreference: layoutPref,
    fitPreference: fitPref,
    isFullscreen,
    toolbarHeight: 88,
  });

  const { isDoublePage, frameWidth, stageHeight, singlePageWidth, spreadGap, canShowDoubleToggle } =
    sizing;
  const step = isDoublePage ? 2 : 1;

  // Reset state when switching PDF file (e.g. VI <-> EN)
  useEffect(() => {
    setPageNumber(1);
    setNumPages(null);
    setLoadError(null);
    setUseNativeFallback(false);
    setPageAspect(0.71);
    setBaseRotate(0);
    setZoom(1);
    setRotation(0);
  }, [fileUrl]);

  // Keep pageNumber aligned to odd index (1, 3, 5...) in 2-page spread mode
  useEffect(() => {
    if (isDoublePage && pageNumber % 2 === 0) {
      setPageNumber((prev) => Math.max(1, prev - 1));
    }
  }, [isDoublePage, pageNumber]);

  // Sync fullscreen state with browser ESC key
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const prevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(1, prev - step));
  }, [step]);

  const nextPage = useCallback(() => {
    setPageNumber((prev) => {
      if (!numPages) return prev;
      const candidate = prev + step;
      return candidate <= numPages ? candidate : prev;
    });
  }, [numPages, step]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPage, nextPage, isFullscreen]);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }

  function resetTransform() {
    setZoom(1);
    setRotation(0);
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoadError(error?.message || 'Không thể tải tài liệu PDF.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onPageLoadSuccess(page: any) {
    try {
      const nativeRotate = typeof page.rotate === 'number' ? page.rotate : 0;
      if (rotation === 0) {
        setBaseRotate(nativeRotate);
      }
      if (typeof page.getViewport === 'function') {
        const vp = page.getViewport({ scale: 1, rotation: nativeRotate });
        if (vp.width > 0 && vp.height > 0) {
          setPageAspect(vp.width / vp.height);
          return;
        }
      }
      if (page.originalWidth > 0 && page.originalHeight > 0) {
        setPageAspect(page.originalWidth / page.originalHeight);
      }
    } catch {
      // keep existing aspect
    }
  }

  // Touch double-tap zoom & swipe page navigation
  function handleTouchStart(e: React.TouchEvent) {
    const now = Date.now();
    const tapLength = now - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0 && e.touches.length === 1) {
      e.preventDefault();
      setZoom((prev) => (prev === 1 ? 1.75 : 1));
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (zoom <= 1 && e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (zoom <= 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }
    touchStartRef.current = null;
  }

  const effectiveSecondPage =
    isDoublePage && numPages && pageNumber + 1 <= numPages ? pageNumber + 1 : null;

  const pageLabel = effectiveSecondPage
    ? `${pageNumber}–${effectiveSecondPage} / ${numPages}`
    : numPages
    ? `${pageNumber} / ${numPages}`
    : '...';

  // When zoomed in > 100%, cap stage height to viewport so user scrolls/pans cleanly inside the card
  const computedStageHeight = isFullscreen
    ? stageHeight
    : useNativeFallback
    ? Math.max(540, Math.min(820, viewportHeight - 190))
    : loadError
    ? 340
    : !numPages
    ? 440
    : zoom > 1
    ? Math.min(stageHeight, Math.max(480, viewportHeight - 170))
    : zoom < 1
    ? Math.max(300, Math.round(stageHeight * zoom))
    : stageHeight;

  return (
    <div ref={outerRef} className="w-full flex justify-center">
      <div
        ref={containerRef}
        className={`flex flex-col select-none transition-[width] duration-200 ${
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen bg-[#141210]'
            : 'bg-[#1C1917] rounded-2xl border border-[#EBDDC3] shadow-luxury overflow-hidden'
        }`}
        style={!isFullscreen && frameWidth ? { width: `${frameWidth}px`, maxWidth: '100%' } : undefined}
      >
        {/* Top Unified Control Bar */}
        <div className="bg-[#1C1917]/95 backdrop-blur-md border-b border-stone-800 text-stone-100 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {title && (
              <span className="font-serif text-xs sm:text-sm font-semibold text-[#E6D3A7] truncate max-w-[140px] sm:max-w-[240px]">
                {title}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-medium bg-stone-800 text-[#E6D3A7] border border-stone-700 shrink-0">
              Trang {pageLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Bilingual VI / EN Switcher */}
            {docLang && onChangeDocLang && (
              <div className="flex items-center bg-stone-800/90 p-0.5 rounded-lg border border-stone-700 mr-0.5">
                <button
                  type="button"
                  onClick={() => onChangeDocLang('vi')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    docLang === 'vi' ? 'bg-[#866526] text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  VI
                </button>
                <button
                  type="button"
                  onClick={() => onChangeDocLang('en')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                    docLang === 'en' ? 'bg-[#866526] text-white' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            )}

            {/* 1 page / 2 pages toggle on wide screens */}
            {canShowDoubleToggle && (
              <div className="hidden md:flex items-center bg-stone-800/90 p-0.5 rounded-lg border border-stone-700">
                <button
                  type="button"
                  onClick={() => setLayoutPref('single')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    !isDoublePage ? 'bg-[#866526] text-white' : 'text-stone-300 hover:text-white'
                  }`}
                  title="Xem 1 trang"
                >
                  <FiFile className="w-3 h-3" />
                  <span>1 trang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutPref('double')}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    isDoublePage ? 'bg-[#866526] text-white' : 'text-stone-300 hover:text-white'
                  }`}
                  title="Xem 2 trang đôi"
                >
                  <FiBookOpen className="w-3 h-3" />
                  <span>2 trang</span>
                </button>
              </div>
            )}

            {/* Fit mode toggle on desktop/tablet */}
            {!isFullscreen && availWidth >= 640 && (
              <button
                type="button"
                onClick={() =>
                  setFitPref((prev) => (prev === 'readable' ? 'viewport' : 'readable'))
                }
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                  fitPref === 'viewport'
                    ? 'bg-[#866526] text-white border-[#B58E38]'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                }`}
                title={
                  fitPref === 'viewport'
                    ? 'Chuyển sang chế độ đầy đặn dễ đọc'
                    : 'Thu gọn vừa 1 màn hình'
                }
              >
                {fitPref === 'viewport' ? (
                  <FiMaximize className="w-3 h-3" />
                ) : (
                  <FiMinimize className="w-3 h-3" />
                )}
                <span className="hidden lg:inline">
                  {fitPref === 'viewport' ? 'Đầy đặn' : 'Vừa khung'}
                </span>
              </button>
            )}

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center text-xs font-bold transition-colors"
              title={getTranslation(language, 'zoom_out')}
            >
              -
            </button>
            <button
              type="button"
              onClick={resetTransform}
              className="text-[11px] font-mono text-stone-200 hover:text-[#E6D3A7] min-w-[40px] text-center px-1 py-1 rounded hover:bg-stone-800 transition-colors"
              title="Đặt lại 100%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center text-xs font-bold transition-colors"
              title={getTranslation(language, 'zoom_in')}
            >
              +
            </button>

            {(zoom !== 1 || rotation !== 0) && (
              <button
                type="button"
                onClick={resetTransform}
                className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-[#E6D3A7] border border-stone-700 flex items-center justify-center transition-colors"
                title="Đặt lại góc nhìn"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 flex items-center justify-center transition-colors"
              title={getTranslation(language, 'rotate')}
            >
              <FiRotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded-lg bg-[#866526] hover:bg-[#A38035] text-white border border-[#B58E38] flex items-center justify-center transition-colors"
              title={
                isFullscreen
                  ? getTranslation(language, 'exit_fullscreen')
                  : getTranslation(language, 'fullscreen')
              }
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-3.5 h-3.5" />
              ) : (
                <FiMaximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Stage hugging PDF content */}
        <div
          className="relative w-full overflow-auto flex items-center justify-center bg-gradient-to-b from-[#231F1C] via-[#1C1917] to-[#151311] p-1.5 sm:p-3 transition-[height] duration-200"
          style={{ height: `${computedStageHeight}px` }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Floating Left / Right Arrows */}
          {!useNativeFallback && numPages && numPages > 1 && (
            <>
              <button
                type="button"
                onClick={prevPage}
                disabled={pageNumber <= 1}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-stone-900/75 hover:bg-[#866526] text-white border border-white/15 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm disabled:opacity-20 disabled:pointer-events-none transition-all"
                title={getTranslation(language, 'previous_page')}
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextPage}
                disabled={pageNumber + step > numPages && pageNumber >= numPages}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-stone-900/75 hover:bg-[#866526] text-white border border-white/15 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm disabled:opacity-20 disabled:pointer-events-none transition-all"
                title={getTranslation(language, 'next_page')}
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {useNativeFallback ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="w-full h-full rounded-lg bg-white border-0"
            />
          ) : loadError ? (
            <div className="max-w-md mx-auto text-center p-6 rounded-2xl bg-stone-900/90 border border-stone-700 space-y-4">
              <p className="text-[#E6D3A7] font-serif text-base font-semibold">
                Không thể hiển thị trực tiếp file PDF
              </p>
              <p className="text-stone-300 text-xs leading-relaxed break-words">{loadError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUseNativeFallback(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#866526] hover:bg-[#A38035] text-white text-xs font-semibold transition-colors"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  <span>Thử trình xem mặc định</span>
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 text-xs font-semibold transition-colors"
                >
                  <FiExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-600 text-xs font-semibold transition-colors"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, 'download')}</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="m-auto flex items-center justify-center">
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onSourceError={onDocumentLoadError}
                loading={
                  <div className="text-center py-12 space-y-2">
                    <FiRefreshCw className="w-6 h-6 text-[#D7BD81] animate-spin mx-auto" />
                    <p className="text-stone-300 text-sm">
                      {getTranslation(language, 'loading_pdf')}
                    </p>
                  </div>
                }
                error={
                  <div className="text-center py-8 text-stone-300 text-sm">
                    Không thể tải file PDF.
                  </div>
                }
              >
                <div
                  className="flex items-center justify-center"
                  style={{ gap: `${spreadGap}px` }}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={singlePageWidth}
                    scale={zoom}
                    rotate={rotation !== 0 ? (baseRotate + rotation) % 360 : undefined}
                    onLoadSuccess={onPageLoadSuccess}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className={`shadow-[0_14px_40px_rgba(0,0,0,0.45)] overflow-hidden bg-white ${
                      effectiveSecondPage ? 'rounded-l-lg' : 'rounded-lg'
                    }`}
                  />
                  {effectiveSecondPage && (
                    <Page
                      pageNumber={effectiveSecondPage}
                      width={singlePageWidth}
                      scale={zoom}
                      rotate={rotation !== 0 ? (baseRotate + rotation) % 360 : undefined}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-[0_14px_40px_rgba(0,0,0,0.45)] rounded-r-lg overflow-hidden bg-white"
                    />
                  )}
                </div>
              </Document>
            </div>
          )}
        </div>

        {/* Bottom Navigation & Actions */}
        <div className="bg-[#1C1917] border-t border-stone-800 px-3 py-2 flex items-center justify-between text-xs text-stone-200 shrink-0 z-20">
          <div className="flex items-center gap-2">
            {!useNativeFallback && numPages && numPages > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prevPage}
                  disabled={pageNumber <= 1}
                  className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-[#866526] text-white flex items-center justify-center disabled:opacity-30 transition-colors"
                  title={getTranslation(language, 'before')}
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[#E6D3A7] px-1">
                  Trang {pageLabel}
                </span>
                <button
                  type="button"
                  onClick={nextPage}
                  disabled={pageNumber + step > numPages && pageNumber >= numPages}
                  className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-[#866526] text-white flex items-center justify-center disabled:opacity-30 transition-colors"
                  title={getTranslation(language, 'after')}
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-stone-400 text-[11px] font-mono">PDF</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
              title="Mở tab mới"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở tab mới</span>
            </a>
            <a
              href={fileUrl}
              download={fileName}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
              title={getTranslation(language, 'download')}
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{getTranslation(language, 'download')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
