'use client';

import { useState, useEffect, RefObject } from 'react';

export type PageLayoutPreference = 'auto' | 'single' | 'double';
export type FitPreference = 'readable' | 'viewport';

export interface ViewerSizingInput {
  availWidth: number;
  viewportWidth?: number;
  viewportHeight: number;
  totalPages: number;
  pageAspect: number; // width / height of a single unrotated page
  rotation: number;
  layoutPreference: PageLayoutPreference;
  fitPreference: FitPreference;
  isFullscreen: boolean;
  toolbarHeight?: number;
}

export interface ViewerSizingResult {
  isDoublePage: boolean;
  frameWidth: number | undefined; // undefined in fullscreen (100vw)
  stageHeight: number;
  singlePageWidth: number;
  spreadGap: number;
  canShowDoubleToggle: boolean;
}

/**
 * Computes content-adaptive container dimensions so the viewer hugs the menu
 * content without empty sidebars or cramped miniature pages across all viewports.
 */
export function computeViewerSizing({
  availWidth,
  viewportWidth,
  viewportHeight,
  totalPages,
  pageAspect,
  rotation,
  layoutPreference,
  fitPreference,
  isFullscreen,
  toolbarHeight = 96,
}: ViewerSizingInput): ViewerSizingResult {
  const safeAvailW = Math.max(280, isFullscreen && viewportWidth ? viewportWidth : availWidth);
  const safeViewH = Math.max(480, viewportHeight);
  const safeAspect = pageAspect > 0.1 && pageAspect < 10 ? pageAspect : 0.71;

  const isRotatedQuarter = rotation % 180 !== 0;
  const effectiveAspect = isRotatedQuarter ? 1 / safeAspect : safeAspect;

  const canShowDoubleToggle = totalPages > 1 && !isRotatedQuarter && safeAvailW >= 720;

  // Landscape pages (effectiveAspect >= 1.15) stay single-page in auto mode so they stay large and legible
  const isDoublePage =
    totalPages > 1 &&
    !isRotatedQuarter &&
    (layoutPreference === 'double'
      ? safeAvailW >= 680
      : layoutPreference === 'auto' && safeAvailW >= 820 && effectiveAspect < 1.15);

  const isMobile = safeAvailW < 640;
  const padX = isMobile ? 12 : 24;
  const padY = isMobile ? 12 : 24;
  const spreadGap = isDoublePage ? (isMobile ? 6 : 12) : 0;

  if (isFullscreen) {
    const fsAvailH = Math.max(300, safeViewH - toolbarHeight - padY);
    const fsAvailW = Math.max(280, safeAvailW - padX - spreadGap);
    const maxSingleWByWidth = isDoublePage ? fsAvailW / 2 : fsAvailW;
    const maxSingleWByHeight = fsAvailH * effectiveAspect;
    const singlePageWidth = Math.max(180, Math.floor(Math.min(maxSingleWByWidth, maxSingleWByHeight)));
    return {
      isDoublePage,
      frameWidth: undefined,
      stageHeight: Math.max(300, safeViewH - toolbarHeight),
      singlePageWidth,
      spreadGap,
      canShowDoubleToggle,
    };
  }

  // Choose an outer column cap tailored to content orientation & page count
  let targetMaxFrameW: number;
  if (isDoublePage) {
    targetMaxFrameW = Math.min(safeAvailW, 1140);
  } else if (effectiveAspect < 0.9) {
    // Portrait single page: full width on mobile/tablet, crisp reading column on desktop
    targetMaxFrameW = isMobile ? safeAvailW : Math.min(safeAvailW, 740);
  } else if (effectiveAspect <= 1.15) {
    // Square-ish single page
    targetMaxFrameW = isMobile ? safeAvailW : Math.min(safeAvailW, 800);
  } else {
    // Landscape single page
    targetMaxFrameW = Math.min(safeAvailW, 1120);
  }

  const innerW = Math.max(220, targetMaxFrameW - padX - spreadGap);
  const rawSingleW = isDoublePage ? innerW / 2 : innerW;
  const rawPageH = rawSingleW / effectiveAspect;

  if (fitPreference === 'viewport') {
    // Fit entire spread/page within current viewport height while tightening frame width to eliminate sidebars
    const maxStageH = Math.max(340, safeViewH - 210);
    const maxInnerH = Math.max(260, maxStageH - padY);
    const clampedPageH = Math.min(rawPageH, maxInnerH);
    const singlePageWidth = Math.max(200, Math.floor(clampedPageH * effectiveAspect));
    const totalContentW = isDoublePage ? singlePageWidth * 2 + spreadGap : singlePageWidth;
    // Keep at least 360px on desktop/tablet so toolbar controls stay on a single line
    const minToolbarW = isMobile ? safeAvailW : Math.min(safeAvailW, 460);
    const frameWidth = Math.min(
      targetMaxFrameW,
      Math.max(minToolbarW, Math.ceil(totalContentW + padX))
    );
    const stageHeight = Math.ceil(clampedPageH + padY);

    return {
      isDoublePage,
      frameWidth,
      stageHeight,
      singlePageWidth,
      spreadGap,
      canShowDoubleToggle,
    };
  }

  // Default 'readable' mode: full-width crisp readability, frame hugs content height cleanly
  // Cap extreme vertical aspect ratios (e.g. long receipts) to avoid runaway canvas heights
  const maxReadablePageH = 1280;
  const clampedPageH = Math.min(rawPageH, maxReadablePageH);
  const singlePageWidth = Math.max(200, Math.floor(clampedPageH * effectiveAspect));
  const totalContentW = isDoublePage ? singlePageWidth * 2 + spreadGap : singlePageWidth;
  const frameWidth = Math.min(
    targetMaxFrameW,
    Math.max(isMobile ? safeAvailW : Math.min(safeAvailW, 460), Math.ceil(totalContentW + padX))
  );
  const stageHeight = Math.ceil(clampedPageH + padY);

  return {
    isDoublePage,
    frameWidth,
    stageHeight,
    singlePageWidth,
    spreadGap,
    canShowDoubleToggle,
  };
}

/**
 * Observes the outer wrapper's width and window height for responsive adaptive viewer sizing.
 */
export function useOuterViewportMetrics(outerRef: RefObject<HTMLElement | null>) {
  const [metrics, setMetrics] = useState<{
    availWidth: number;
    viewportWidth: number;
    viewportHeight: number;
  }>({
    availWidth: 1024,
    viewportWidth: 1280,
    viewportHeight: 768,
  });

  useEffect(() => {
    function updateWindowSize() {
      setMetrics((prev) => ({
        availWidth: outerRef.current ? outerRef.current.clientWidth || prev.availWidth : prev.availWidth,
        viewportWidth: window.innerWidth || 1280,
        viewportHeight: window.innerHeight || 768,
      }));
    }

    updateWindowSize();

    const el = outerRef.current;
    const observer =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            for (const entry of entries) {
              const w = entry.contentRect.width;
              if (w > 0) {
                setMetrics({
                  availWidth: w,
                  viewportWidth: window.innerWidth || 1280,
                  viewportHeight: window.innerHeight || 768,
                });
              }
            }
          })
        : null;

    if (el && observer) {
      observer.observe(el);
    }

    window.addEventListener('resize', updateWindowSize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateWindowSize);
    };
  }, [outerRef]);

  return metrics;
}
