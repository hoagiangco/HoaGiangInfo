'use client';

import { useState, useEffect, useRef } from 'react';
import PDFViewer from './PDFViewer';
import FlipbookViewer from './FlipbookViewer';
import Image from 'next/image';
import { FiMaximize2, FiMinimize2, FiRotateCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image: string | null;
  category: string | null;
  isAvailable: boolean;
}

interface Menu {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  flipbookId: string | null;
  flipbook: {
    id: string;
    name: string;
    pages: string[];
  } | null;
  items: MenuItem[];
}

interface MenuDetailViewProps {
  menu: Menu;
}

export default function MenuDetailView({ menu }: MenuDetailViewProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'items' | 'image' | 'pdf' | 'flipbook'>('items');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const lastTapRef = useRef<number>(0);

  // Get all categories from items
  const categories = Array.from(
    new Set(menu.items.map((item) => item.category || 'Other'))
  ).sort();

  // Filter items by category
  const filteredItems = menu.items.filter(
    (item) =>
      selectedCategory === 'all' || item.category === selectedCategory
  );

  // Group items by category for display
  const itemsByCategory: Record<string, MenuItem[]> = {};
  filteredItems.forEach((item) => {
    const category = item.category || 'Other';
    if (!itemsByCategory[category]) {
      itemsByCategory[category] = [];
    }
    itemsByCategory[category].push(item);
  });

  // Get file URL and type from menu
  const fileUrl = menu.fileUrl || null;
  const fileType = menu.fileType || (fileUrl?.toLowerCase().endsWith('.pdf') ? 'pdf' : fileUrl ? 'image' : null);
  const isPDF = fileType === 'pdf';
  const isImage = fileType === 'image';
  const isFlipbook = fileType === 'flipbook' && menu.flipbook;

  // Get all item images
  const itemImages = menu.items
    .filter((item) => item.image)
    .map((item) => item.image!);

  function rotateContent() {
    setRotation((prev) => (prev + 90) % 360);
  }

  const imageContainerRef = useRef<HTMLDivElement>(null);

  function handleDoubleTap(e: React.TouchEvent) {
    if (viewMode === 'image' || viewMode === 'pdf') {
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
  }

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      if (viewMode === 'image' || viewMode === 'pdf') {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
    }

    const container = imageContainerRef.current;
    if (container && (viewMode === 'image' || viewMode === 'pdf')) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [viewMode]);

  function toggleFullscreen() {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }

  // Auto-detect view mode on mount
  useEffect(() => {
    if (isFlipbook && viewMode === 'items') {
      setViewMode('flipbook');
    } else if (fileUrl && viewMode === 'items') {
      if (isPDF) {
        setViewMode('pdf');
      } else if (isImage) {
        setViewMode('image');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {/* Title and View Mode Tabs */}
      <div className="mt-[5px] mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">{menu.name}</h1>
        {(fileUrl || isFlipbook || itemImages.length > 0) && (
          <div className="flex gap-1">
            {isFlipbook && (
              <button
                onClick={() => setViewMode('flipbook')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'flipbook'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslation(language, 'flipbook')}
              </button>
            )}
            {fileUrl && (
              <button
                onClick={() => setViewMode(isPDF ? 'pdf' : 'image')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'pdf' || viewMode === 'image'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isPDF ? 'PDF' : getTranslation(language, 'image')}
              </button>
            )}
            {itemImages.length > 0 && (
              <button
                onClick={() => {
                  setViewMode('image');
                  setCurrentImageIndex(0);
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'image' && !fileUrl && !isFlipbook
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getTranslation(language, 'images')} ({itemImages.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Flipbook View */}
      {viewMode === 'flipbook' && isFlipbook && menu.flipbook && (
        <div className="bg-white rounded-lg shadow-md p-2 mb-2 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <FlipbookViewer pages={menu.flipbook.pages} title={menu.flipbook.name} />
        </div>
      )}

      {/* PDF/Image View */}
      {(viewMode === 'pdf' || viewMode === 'image') && fileUrl && (
        <div className="bg-white rounded-lg shadow-md p-2 mb-2 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex items-center justify-end mb-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'zoom_out')}
              >
                <span className="text-xs">-</span>
              </button>
              <span className="text-xs text-gray-600 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'zoom_in')}
              >
                <span className="text-xs">+</span>
              </button>
              <button
                onClick={rotateContent}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'rotate')}
              >
                <FiRotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-6 h-6 p-1 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center justify-center"
                title={getTranslation(language, 'fullscreen')}
              >
                <FiMaximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div 
            ref={imageContainerRef}
            className="w-full h-[calc(100%-40px)] overflow-auto"
            onTouchStart={handleDoubleTap}
          >
            {isPDF ? (
              <PDFViewer fileUrl={fileUrl} fileName={`${menu.name}.pdf`} zoom={zoom} />
            ) : (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={fileUrl}
                  alt={menu.name}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Images Gallery */}
      {viewMode === 'image' && !fileUrl && itemImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-2 mb-2 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex items-center justify-end mb-1">
            <span className="text-xs text-gray-500 mr-2">
              {currentImageIndex + 1}/{itemImages.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev > 0 ? prev - 1 : itemImages.length - 1
                  )
                }
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <FiChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev < itemImages.length - 1 ? prev + 1 : 0
                  )
                }
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
              >
                <FiChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'zoom_out')}
              >
                <span className="text-xs">-</span>
              </button>
              <span className="text-xs text-gray-600 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'zoom_in')}
              >
                <span className="text-xs">+</span>
              </button>
              <button
                onClick={rotateContent}
                className="w-6 h-6 p-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                title={getTranslation(language, 'rotate')}
              >
                <FiRotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-6 h-6 p-1 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center justify-center"
                title={getTranslation(language, 'fullscreen')}
              >
                <FiMaximize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div 
            ref={imageContainerRef}
            className="w-full h-[calc(100%-40px)] overflow-auto flex items-center justify-center"
            onTouchStart={handleDoubleTap}
          >
            <div
              className="relative"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={itemImages[currentImageIndex]}
                alt={`${menu.name} - Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Items List View */}
      {viewMode === 'items' && (
        <>
          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 rounded transition-colors text-xs ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded transition-colors text-xs ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Items Display */}
          {Object.keys(itemsByCategory).length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-xs text-gray-600">{getTranslation(language, 'no_items')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category} className="bg-white rounded-lg shadow-md p-2">
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-gray-200 pb-2 last:border-0"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 text-xs">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.price && (
                            <div className="text-xs font-bold text-primary-600 flex-shrink-0">
                              {item.price.toLocaleString('vi-VN')}đ
                            </div>
                          )}
                        </div>
                        {item.image && (
                          <div className="mt-1 rounded overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-24 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

