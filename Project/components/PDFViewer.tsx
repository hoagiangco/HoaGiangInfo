'use client';

import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiMaximize2, FiMinimize2, FiRotateCw, FiDownload } from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  zoom?: number;
}

export default function PDFViewer({ fileUrl, fileName, zoom: externalZoom }: PDFViewerProps) {
  const { language } = useLanguage();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const currentScale = externalZoom !== undefined ? externalZoom : scale;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
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

  function handleZoomIn() {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }

  function handleZoomOut() {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }

  function handleResetZoom() {
    setScale(1);
    setRotation(0);
  }

  function handleDoubleTap(e: React.TouchEvent) {
    if (externalZoom === undefined) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapRef.current;
      
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        // Toggle zoom between 1x and 2x
        setScale((prev) => (prev === 1 ? 2 : 1));
        lastTapRef.current = 0; // Reset to prevent triple tap
      } else {
        lastTapRef.current = currentTime;
      }
    }
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    function handleWheel(e: WheelEvent) {
      if (externalZoom === undefined) {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Add wheel event listener
    const container = containerRef.current;
    if (container && externalZoom === undefined) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [externalZoom]);

  return (
    <div className="w-full" ref={containerRef}>
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">{getTranslation(language, 'loading_document')}</p>
        </div>
      )}

      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{fileName}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-700 rounded"
              title={getTranslation(language, 'zoom_out')}
            >
              -
            </button>
            <span className="px-3">{Math.round(scale * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-700 rounded"
              title={getTranslation(language, 'zoom_in')}
            >
              +
            </button>
            <button
              onClick={rotateContent}
              className="p-2 hover:bg-gray-700 rounded"
              title={getTranslation(language, 'rotate')}
            >
              <FiRotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-700 rounded text-sm"
              title="Reset"
            >
              Reset
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-700 rounded"
              title={getTranslation(language, 'exit_fullscreen')}
            >
              <FiMinimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`${isFullscreen ? 'fixed inset-0 z-40 bg-black overflow-auto pt-16' : 'relative'} transition-all`}
        style={!isFullscreen ? { height: 'calc(100vh - 120px)', overflow: 'auto' } : {}}
      >
        <div
          className={`${isFullscreen ? 'p-8' : 'h-full flex items-center justify-center p-2'} flex justify-center`}
          style={{
            transform: `rotate(${rotation}deg) scale(${isFullscreen ? scale : currentScale})`,
            transformOrigin: 'center center',
          }}
          onTouchStart={handleDoubleTap}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center py-8">
                <p className="text-gray-600">{getTranslation(language, 'loading_pdf')}</p>
              </div>
            }
          >
            <div className="flex flex-col items-center">
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className={`${isFullscreen ? 'mb-4' : 'max-h-full max-w-full'}`}
                scale={isFullscreen ? scale : currentScale}
              />

              {numPages && numPages > 1 && (
                <div className="flex items-center space-x-4 mt-4">
                  <button
                    onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-gray-300"
                  >
                    {getTranslation(language, 'before')}
                  </button>
                  <span className={`${isFullscreen ? 'text-white' : 'text-gray-700'}`}>
                    {getTranslation(language, 'page_of', { current: String(pageNumber), total: String(numPages || 0) })}
                  </span>
                  <button
                    onClick={() =>
                      setPageNumber((prev) => Math.min(numPages, prev + 1))
                    }
                    disabled={pageNumber >= numPages}
                    className="px-4 py-2 bg-primary-600 text-white rounded disabled:bg-gray-300"
                  >
                    {getTranslation(language, 'after')}
                  </button>
                </div>
              )}
            </div>
          </Document>
        </div>
      </div>

      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            onClick={handleZoomOut}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={rotateContent}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center"
            title="Rotate"
          >
            <FiRotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
              title={getTranslation(language, 'fullscreen')}
          >
            <FiMaximize2 className="w-4 h-4" />
          </button>
          <a
            href={fileUrl}
            download={fileName}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <FiDownload className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}


