'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
  FiBookOpen,
  FiFile,
  FiGrid,
  FiRefreshCw,
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

interface FlipbookViewerProps {
  pages: string[];
  title?: string;
}

export default function FlipbookViewer({
  pages,
  title,
}: FlipbookViewerProps) {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [pageLayout, setPageLayout] = useState<PageLayoutPreference>('auto');
  const [fitPref, setFitPref] = useState<FitPreference>('readable');
  const [pageAspect, setPageAspect] = useState<number>(0.71);
  const [resolvedPages, setResolvedPages] = useState<string[]>(pages);
  const [resolvingPdf, setResolvingPdf] = useState(false);

  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const { availWidth, viewportWidth, viewportHeight } = useOuterViewportMetrics(outerRef);

  // Dynamically expand any raw .pdf URL in pages into rendered image URLs on the client
  useEffect(() => {
    let isMounted = true;
    const hasPdf = pages.some((p) => p?.toLowerCase().endsWith('.pdf'));

    if (!hasPdf) {
      setResolvedPages(pages);
      setCurrentPage((prev) => Math.min(prev, Math.max(0, pages.length - 1)));
      return;
    }

    async function expandPdfUrls() {
      setResolvingPdf(true);
      const expanded: string[] = [];

      for (const pageUrl of pages) {
        if (pageUrl?.toLowerCase().endsWith('.pdf')) {
          try {
            const { convertPdfToImageFiles } = await import('@/lib/pdf-to-images');
            const imageFiles = await convertPdfToImageFiles(pageUrl, {
              scale: 1.8,
              quality: 0.85,
            });
            const objectUrls = imageFiles.map((file) => URL.createObjectURL(file));
            expanded.push(...objectUrls);
          } catch (err) {
            console.error('Error rendering legacy PDF in flipbook:', err);
            expanded.push(pageUrl);
          }
        } else {
          expanded.push(pageUrl);
        }
      }

      if (isMounted) {
        setResolvedPages(expanded);
        setCurrentPage((prev) => Math.min(prev, Math.max(0, expanded.length - 1)));
        setResolvingPdf(false);
      }
    }

    expandPdfUrls();

    return () => {
      isMounted = false;
    };
  }, [pages]);

  const totalPages = resolvedPages.length;

  const sizing = computeViewerSizing({
    availWidth,
    viewportWidth,
    viewportHeight,
    totalPages,
    pageAspect,
    rotation,
    layoutPreference: pageLayout,
    fitPreference: fitPref,
    isFullscreen,
    toolbarHeight: showThumbnails ? 168 : 84,
  });

  const { isDoublePage, frameWidth, stageHeight, singlePageWidth, spreadGap, canShowDoubleToggle } =
    sizing;
  const step = isDoublePage ? 2 : 1;

  // Align currentPage when switching to double page mode
  useEffect(() => {
    if (isDoublePage && currentPage % 2 !== 0) {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    }
  }, [isDoublePage, currentPage]);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      const targetPage = isDoublePage ? Math.floor(page / 2) * 2 : page;
      if (targetPage < 0 || targetPage >= totalPages || isSliding || targetPage === currentPage) {
        return;
      }

      const direction = targetPage > currentPage ? 'right' : 'left';
      setSlideDirection(direction);
      setIsSliding(true);
      setPan({ x: 0, y: 0 });
      setCurrentPage(targetPage);

      setTimeout(() => {
        setIsSliding(false);
        setSlideDirection(null);
      }, 220);
    },
    [currentPage, isDoublePage, isSliding, totalPages]
  );

  const nextPage = useCallback(() => {
    if (currentPage + step < totalPages) {
      goToPage(currentPage + step);
    } else if (currentPage < totalPages - 1) {
      goToPage(totalPages - 1);
    }
  }, [currentPage, goToPage, step, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage - step >= 0) {
      goToPage(currentPage - step);
    } else if (currentPage > 0) {
      goToPage(0);
    }
  }, [currentPage, goToPage, step]);

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

  function rotateContent() {
    setRotation((prev) => (prev + 90) % 360);
    setPan({ x: 0, y: 0 });
  }

  function handleZoomChange(newZoom: number) {
    const clamped = Math.max(0.5, Math.min(3, Number(newZoom.toFixed(2))));
    setZoom(clamped);
    if (clamped <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }

  // Touch double-tap to zoom & swipe to change page
  function handleTouchStart(e: React.TouchEvent) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;

    if (tapLength < 300 && tapLength > 0 && e.touches.length === 1) {
      e.preventDefault();
      handleZoomChange(zoom === 1 ? 2 : 1);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = currentTime;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (zoom > 1 && isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    setIsDragging(false);
    if (zoom === 1 && touchStartRef.current && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) nextPage();
        else prevPage();
      }
    }
    touchStartRef.current = null;
  }

  // Mouse drag to pan when zoomed
  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    function handleWheel(e: WheelEvent) {
      if (e.ctrlKey || zoom > 1) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        setZoom((prev) => {
          const next = Math.max(0.5, Math.min(3, Number((prev + delta).toFixed(2))));
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const pageContainer = pageContainerRef.current;
    if (pageContainer) {
      pageContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (pageContainer) {
        pageContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [prevPage, nextPage, isFullscreen]);

  if (resolvingPdf) {
    return (
      <div className="w-full min-h-[380px] bg-[#1C1917] rounded-2xl border border-[#EBDDC3] p-8 flex flex-col items-center justify-center text-center space-y-3">
        <FiRefreshCw className="w-7 h-7 text-[#D7BD81] animate-spin" />
        <p className="text-stone-200 text-sm font-medium">
          {getTranslation(language, 'converting_pdf_flipbook')}
        </p>
      </div>
    );
  }

  if (resolvedPages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EBDDC3] p-8 text-center">
        <p className="text-stone-500 text-sm">{getTranslation(language, 'no_pages')}</p>
      </div>
    );
  }

  const visiblePages = isDoublePage
    ? [resolvedPages[currentPage], resolvedPages[currentPage + 1]].filter(Boolean)
    : [resolvedPages[currentPage]].filter(Boolean);

  const pageLabel =
    isDoublePage && currentPage + 1 < totalPages
      ? `${currentPage + 1}–${currentPage + 2} / ${totalPages}`
      : `${currentPage + 1} / ${totalPages}`;

  const computedStageHeight = isFullscreen
    ? stageHeight
    : zoom > 1
    ? Math.min(stageHeight, Math.max(460, viewportHeight - 170))
    : zoom < 1
    ? Math.max(280, Math.round(stageHeight * zoom))
    : stageHeight;

  const isRotatedQuarter = rotation % 180 !== 0;

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
        {/* Unified Compact High-Contrast Control Bar — Fits cleanly down to 360px Android */}
        <div className="bg-[#0F172A] border-b border-slate-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 z-30">
          {/* Left: Title & Page Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {title && (
              <h3 className="hidden sm:block font-serif text-xs sm:text-sm font-bold text-[#E8CA7A] truncate max-w-[260px]">
                {title}
              </h3>
            )}
            {(totalPages > 1 || !title) && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-slate-800 text-[#E8CA7A] border border-slate-600 shrink-0 whitespace-nowrap">
                {totalPages > 1 ? (
                  <>
                    <span className="sm:hidden">{pageLabel}</span>
                    <span className="hidden sm:inline">
                      {getTranslation(language, 'page_label', { label: pageLabel })}
                    </span>
                  </>
                ) : (
                  getTranslation(language, 'image')
                )}
              </span>
            )}
          </div>

          {/* Right: Touch-Friendly High-Contrast Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Single / Double Spread Toggle on wide screens */}
            {canShowDoubleToggle && (
              <div className="hidden md:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-600">
                <button
                  type="button"
                  onClick={() => setPageLayout('single')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    !isDoublePage
                      ? 'bg-[#E8CA7A] text-[#0F172A]'
                      : 'text-slate-200 hover:text-white'
                  }`}
                  title={getTranslation(language, 'single_page_tooltip')}
                >
                  <FiFile className="w-3 h-3" />
                  <span>{getTranslation(language, 'single_page')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPageLayout('double')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    isDoublePage
                      ? 'bg-[#E8CA7A] text-[#0F172A]'
                      : 'text-slate-200 hover:text-white'
                  }`}
                  title={getTranslation(language, 'double_page_tooltip')}
                >
                  <FiBookOpen className="w-3 h-3" />
                  <span>{getTranslation(language, 'double_page')}</span>
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
                className={`hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border text-[11px] font-bold transition-colors ${
                  fitPref === 'viewport'
                    ? 'bg-[#E8CA7A] text-[#0F172A] border-[#E8CA7A]'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                }`}
                title={
                  fitPref === 'viewport'
                    ? getTranslation(language, 'fit_readable_tooltip')
                    : getTranslation(language, 'fit_viewport_tooltip')
                }
              >
                {fitPref === 'viewport' ? (
                  <FiMaximize className="w-3.5 h-3.5" />
                ) : (
                  <FiMinimize className="w-3.5 h-3.5" />
                )}
                <span className="hidden lg:inline">
                  {fitPref === 'viewport'
                    ? getTranslation(language, 'fit_readable')
                    : getTranslation(language, 'fit_viewport')}
                </span>
              </button>
            )}

            {/* Thumbnails Toggle */}
            {totalPages > 1 && (
              <button
                type="button"
                onClick={() => setShowThumbnails((prev) => !prev)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
                  showThumbnails
                    ? 'bg-[#E8CA7A] text-[#0F172A] border-[#E8CA7A]'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                }`}
                title={getTranslation(language, 'thumbnails_tooltip')}
              >
                <FiGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.25)}
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold transition-colors"
              title={getTranslation(language, 'zoom_out')}
            >
              −
            </button>
            <button
              type="button"
              onClick={resetTransform}
              className="text-[11px] sm:text-xs font-mono font-bold text-white hover:text-[#E8CA7A] min-w-[36px] sm:min-w-[42px] h-8 text-center px-1 rounded-lg hover:bg-slate-800 transition-colors"
              title={getTranslation(language, 'reset_zoom')}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.25)}
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold transition-colors"
              title={getTranslation(language, 'zoom_in')}
            >
              +
            </button>

            {(zoom !== 1 || rotation !== 0) && (
              <button
                type="button"
                onClick={resetTransform}
                className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-[#E8CA7A] border border-slate-600 rounded-lg flex items-center justify-center transition-colors"
                title={getTranslation(language, 'reset_view')}
              >
                <FiRefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={rotateContent}
              className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg flex items-center justify-center transition-colors"
              title={getTranslation(language, 'rotate')}
            >
              <FiRotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 bg-[#E8CA7A] hover:bg-[#F3DA94] text-[#0F172A] border border-[#E8CA7A] rounded-lg flex items-center justify-center transition-colors"
              title={
                isFullscreen
                  ? getTranslation(language, 'exit_fullscreen')
                  : getTranslation(language, 'fullscreen')
              }
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <FiMaximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Main Page Stage - Content-Hugging Display */}
        <div
          ref={pageContainerRef}
          className={`relative w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#231F1C] via-[#1C1917] to-[#151311] transition-[height] duration-200 ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          style={{ height: `${computedStageHeight}px` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Previous Page Button */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0 || isSliding}
              className="absolute left-2 sm:left-3 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-stone-900/75 hover:bg-[#866526] text-white border border-white/15 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm disabled:opacity-20 disabled:pointer-events-none transition-all"
              title={getTranslation(language, 'previous_page')}
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Active Page(s) Canvas */}
          <div
            key={currentPage}
            className={`w-full h-full flex items-center justify-center p-1.5 sm:p-3 transition-opacity duration-200 ease-out ${
              isSliding
                ? slideDirection === 'right'
                  ? 'opacity-0 -translate-x-3'
                  : 'opacity-0 translate-x-3'
                : 'opacity-100 translate-x-0'
            }`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ gap: `${spreadGap}px` }}
            >
              {visiblePages.map((pageUrl, idx) => {
                const pageNumber = currentPage + idx + 1;
                const isPdfPage = pageUrl?.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={`${pageNumber}-${pageUrl}`}
                    className={`h-full flex items-center justify-center ${
                      isDoublePage && visiblePages.length > 1
                        ? idx === 0
                          ? 'flex-1 justify-end'
                          : 'flex-1 justify-start'
                        : 'w-full'
                    }`}
                  >
                    {isPdfPage ? (
                      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl shadow-2xl p-6">
                        <div className="text-center">
                          <p className="text-stone-600 text-sm mb-3">
                            {getTranslation(language, 'pdf_page_number', { page: pageNumber })}
                          </p>
                          <a
                            href={pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-white bg-[#866526] hover:bg-[#A38035] px-4 py-2 rounded-lg inline-block"
                          >
                            {getTranslation(language, 'open_pdf_new_tab')}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={pageUrl}
                        alt={`${getTranslation(language, 'page')} ${pageNumber}`}
                        draggable={false}
                        onLoad={(e) => {
                          if (idx === 0) {
                            const img = e.currentTarget;
                            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                              setPageAspect(img.naturalWidth / img.naturalHeight);
                            }
                          }
                        }}
                        style={
                          isRotatedQuarter
                            ? {
                                maxWidth: `${Math.max(180, computedStageHeight - 24)}px`,
                                maxHeight: `${singlePageWidth}px`,
                              }
                            : {
                                maxWidth: '100%',
                                maxHeight: '100%',
                              }
                        }
                        className={`w-auto h-auto object-contain shadow-[0_14px_45px_rgba(0,0,0,0.45)] ${
                          isDoublePage && visiblePages.length > 1
                            ? idx === 0
                              ? 'rounded-l-lg'
                              : 'rounded-r-lg'
                            : 'rounded-lg'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Page Button */}
          {totalPages > 1 && (
            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage + step >= totalPages || isSliding}
              className="absolute right-2 sm:right-3 z-30 w-9 h-9 sm:w-10 sm:h-10 bg-stone-900/75 hover:bg-[#866526] text-white border border-white/15 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm disabled:opacity-20 disabled:pointer-events-none transition-all"
              title={getTranslation(language, 'next_page')}
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Expandable Quick Thumbnail Strip */}
        {showThumbnails && totalPages > 1 && (
          <div className="bg-[#141210]/95 border-t border-stone-800 px-3 py-2.5 flex items-center gap-2.5 overflow-x-auto shrink-0 z-20">
            {resolvedPages.map((pageUrl, idx) => {
              const isCurrent = isDoublePage
                ? idx === currentPage || idx === currentPage + 1
                : idx === currentPage;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToPage(idx)}
                  className={`relative group shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    isCurrent
                      ? 'border-[#B58E38] ring-2 ring-[#B58E38]/40 scale-105'
                      : 'border-stone-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={pageUrl}
                    alt={`${getTranslation(language, 'page')} ${idx + 1}`}
                    className="w-full h-full object-cover bg-stone-900"
                  />
                  <span
                    className={`absolute bottom-0 inset-x-0 text-[10px] font-mono font-bold py-0.5 text-center ${
                      isCurrent
                        ? 'bg-[#866526] text-white'
                        : 'bg-black/70 text-stone-300'
                    }`}
                  >
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thumb-Friendly Bottom Navigation & Page Dots */}
        {totalPages > 1 && (
          <div className="bg-[#0F172A] border-t border-slate-700 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={prevPage}
              disabled={currentPage === 0 || isSliding}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-bold disabled:opacity-30 transition-colors shrink-0"
              title={getTranslation(language, 'previous_page')}
            >
              <FiChevronLeft className="w-4 h-4" />
              <span>{getTranslation(language, 'before')}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 flex-wrap overflow-hidden max-h-5">
              {resolvedPages.map((_, index) => {
                if (isDoublePage && index % 2 !== 0) return null;
                const isActive = isDoublePage
                  ? index === currentPage || index + 1 === currentPage
                  : index === currentPage;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goToPage(index)}
                    disabled={isSliding}
                    className={`h-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-[#E8CA7A] w-6'
                        : 'bg-slate-600 hover:bg-slate-400 w-2'
                    }`}
                    title={`${getTranslation(language, 'page')} ${
                      isDoublePage && index + 1 < totalPages
                        ? `${index + 1}-${index + 2}`
                        : index + 1
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={nextPage}
              disabled={currentPage + step >= totalPages || isSliding}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-[#E8CA7A] hover:bg-[#F3DA94] text-[#0F172A] text-xs font-bold disabled:opacity-30 transition-colors shrink-0"
              title={getTranslation(language, 'next_page')}
            >
              <span>{getTranslation(language, 'after')}</span>
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
