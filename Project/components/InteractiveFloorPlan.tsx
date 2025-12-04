'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiMaximize2, FiMinimize2, FiRotateCw } from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation } from '@/lib/i18n';

interface Room {
  id: string;
  number: string;
  type: string;
  description: string | null;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface FloorPlan {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  fileType: string | null;
  rooms: Room[];
}

interface InteractiveFloorPlanProps {
  floorPlan: FloorPlan;
}

export default function InteractiveFloorPlan({
  floorPlan,
}: InteractiveFloorPlanProps) {
  const { language } = useLanguage();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  function handleRoomClick(room: Room) {
    setSelectedRoom(room);
  }

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!imageRef.current || !floorPlan.rooms.length) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find room at this position
    const clickedRoom = floorPlan.rooms.find((room) => {
      if (!room.x || !room.y || !room.width || !room.height) return false;
      return (
        x >= room.x &&
        x <= room.x + room.width &&
        y >= room.y &&
        y <= room.y + room.height
      );
    });

    if (clickedRoom) {
      handleRoomClick(clickedRoom);
    }
  }

  const roomTypes: Record<string, { label: string; color: string }> = {
    standard: { label: 'Phòng Tiêu Chuẩn', color: 'bg-blue-500' },
    deluxe: { label: 'Phòng Deluxe', color: 'bg-green-500' },
    suite: { label: 'Suite', color: 'bg-purple-500' },
    villa: { label: 'Villa', color: 'bg-yellow-500' },
  };

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

  function handleResetView() {
    setZoom(1);
    setRotation(0);
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
    const imageElement = imageRef.current;
    if (imageElement) {
      imageElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (imageElement) {
        imageElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">{floorPlan.name}</h1>
        {!isFullscreen && (
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
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
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
        )}
      </div>

      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white p-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{floorPlan.name}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="w-6 h-6 p-1 hover:bg-gray-700 rounded flex items-center justify-center"
              title={getTranslation(language, 'zoom_out')}
            >
              <span className="text-xs">-</span>
            </button>
            <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="w-6 h-6 p-1 hover:bg-gray-700 rounded flex items-center justify-center"
              title={getTranslation(language, 'zoom_in')}
            >
              <span className="text-xs">+</span>
            </button>
            <button
              onClick={rotateContent}
              className="w-6 h-6 p-1 hover:bg-gray-700 rounded flex items-center justify-center"
              title="Rotate"
            >
              <FiRotateCw className="w-3 h-3" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-6 h-6 p-1 hover:bg-gray-700 rounded flex items-center justify-center"
              title={getTranslation(language, 'exit_fullscreen')}
            >
              <FiMinimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`${isFullscreen ? 'fixed inset-0 z-40 bg-black overflow-auto pt-10' : 'bg-white rounded-lg shadow-md p-2 relative overflow-hidden'}`}
        style={!isFullscreen ? { height: 'calc(100vh - 120px)' } : {}}
      >
        {floorPlan.imageUrl ? (
          <div
            ref={imageRef}
            className="relative cursor-crosshair flex items-center justify-center w-full h-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            onClick={handleImageClick}
            onTouchStart={handleDoubleTap}
          >
            {floorPlan.fileType === 'pdf' ? (
              <iframe
                src={floorPlan.imageUrl}
                className={`${isFullscreen ? 'w-full h-[calc(100vh-80px)]' : 'w-full h-full'}`}
                title="Floor Plan PDF"
              />
            ) : (
              <img
                src={floorPlan.imageUrl}
                alt={floorPlan.name}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                draggable={false}
              />
            )}

            {/* Render clickable areas for rooms */}
            {floorPlan.rooms.map((room) => {
              if (!room.x || !room.y || !room.width || !room.height) return null;
              return (
                <div
                  key={room.id}
                  className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20 hover:bg-opacity-40 cursor-pointer transition-all"
                  style={{
                    left: `${room.x}%`,
                    top: `${room.y}%`,
                    width: `${room.width}%`,
                    height: `${room.height}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoomClick(room);
                  }}
                  title={`Room ${room.number}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">{getTranslation(language, 'no_floor_plan')}</p>
          </div>
        )}
      </div>

      {selectedRoom && (
        <div className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-800">
                Phòng {selectedRoom.number}
              </h3>
              {selectedRoom.description && (
                <p className="text-xs text-gray-600 mt-0.5">{selectedRoom.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-gray-500 hover:text-gray-700 text-xs"
              title="Đóng"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


