'use client';

import { useState, useRef, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiMinimize2, FiRotateCw } from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

interface FlipbookViewerProps {
  pages: string[];
  title?: string;
}

export default function FlipbookViewer({ pages, title }: FlipbookViewerProps) {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const totalPages = pages.length;

  function goToPage(page: number) {
    if (page < 0 || page >= totalPages || isSliding) return;
    
    const direction = page > currentPage ? 'right' : 'left';
    setSlideDirection(direction);
    setIsSliding(true);
    
    // Update page immediately, then reset slide state after animation
    setCurrentPage(page);
    setTimeout(() => {
      setIsSliding(false);
      setSlideDirection(null);
    }, 300);
  }

  function nextPage() {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  }

  function rotateContent() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function handleDoubleTap(e: React.TouchEvent) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapRef.current;
    
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      // Toggle zoom between 1x and 2x
      setZoom((prev) => (prev === 1 ? 2 : 1));
      lastTapRef.current = 0; // Reset to prevent triple tap
    } else {
      lastTapRef.current = currentTime;
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Add wheel event listener
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
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
    }

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  if (pages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">{getTranslation(language, 'no_pages')}</p>
      </div>
    );
  }


  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen m-0 p-0' : 'rounded-lg shadow-md h-full'} overflow-hidden`}
      style={isFullscreen ? { width: '100vw', height: '100vh', margin: 0, padding: 0 } : {}}
    >
      {/* Header */}
      {!isFullscreen && title && (
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'zoom_out')}
              >
                <span className="text-xs text-white">-</span>
              </button>
              <span className="text-xs text-gray-300 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'zoom_in')}
              >
                <span className="text-xs text-white">+</span>
              </button>
              <button
                onClick={rotateContent}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'rotate')}
              >
                <FiRotateCw className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'fullscreen')}
              >
                <FiMaximize2 className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-90 text-white px-4 py-2 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold">{title || getTranslation(language, 'flipbook')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              {getTranslation(language, 'page_of', { current: String(currentPage + 1), total: String(totalPages) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'zoom_out')}
              >
                <span className="text-xs text-white">-</span>
              </button>
              <span className="text-xs text-gray-300 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'zoom_in')}
              >
                <span className="text-xs text-white">+</span>
              </button>
              <button
                onClick={rotateContent}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'rotate')}
              >
                <FiRotateCw className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-6 h-6 p-1 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"
                title={getTranslation(language, 'exit_fullscreen')}
              >
                <FiMinimize2 className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flipbook Container - Simple Slide Effect */}
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full h-full'} flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 overflow-hidden`}>
        {/* Previous Page Button */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0 || isSliding}
          className="absolute left-4 z-30 p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title={getTranslation(language, 'previous_page')}
        >
          <FiChevronLeft className="w-6 h-6 text-gray-800" />
        </button>

        {/* Page Container with Slide Effect */}
        <div 
          ref={pageContainerRef}
          className="relative w-[90%] max-w-4xl h-[90%] overflow-hidden"
          onTouchStart={handleDoubleTap}
        >
          {/* Current Page */}
          <div
            key={currentPage}
            className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out ${
              isSliding 
                ? slideDirection === 'right' 
                  ? 'opacity-0 translate-x-[-20px]' 
                  : 'opacity-0 translate-x-[20px]'
                : 'opacity-100 translate-x-0'
            }`}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {pages[currentPage]?.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-xl">
                <div className="text-center p-8">
                  <p className="text-gray-600 mb-4">PDF files cần được chuyển đổi thành hình ảnh</p>
                  <a
                    href={pages[currentPage]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline inline-block px-4 py-2 bg-primary-100 rounded-lg"
                  >
                    Mở PDF trong tab mới
                  </a>
                </div>
              </div>
            ) : (
              <img
                src={pages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="w-full h-full object-contain rounded-lg shadow-xl bg-white"
                style={{ 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            )}
          </div>
        </div>

        {/* Next Page Button */}
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1 || isSliding}
          className="absolute right-4 z-30 p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title={getTranslation(language, 'next_page')}
        >
          <FiChevronRight className="w-6 h-6 text-gray-800" />
        </button>
      </div>

      {/* Page Navigation Dots */}
      {!isFullscreen && (
        <div className="bg-gray-800 px-4 py-3 flex items-center justify-center gap-2 flex-wrap">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToPage(index)}
              disabled={isSliding}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPage
                  ? 'bg-white w-8'
                  : 'bg-gray-500 hover:bg-gray-400'
              } ${isSliding ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={getTranslation(language, 'page') + ' ' + (index + 1)}
            />
          ))}
        </div>
      )}

      {/* Instructions */}
      {!isFullscreen && (
        <div className="bg-gray-100 px-4 py-2 text-center text-sm text-gray-600">
          <p>{getTranslation(language, 'page_navigation_hint')}</p>
        </div>
      )}
    </div>
  );
}
