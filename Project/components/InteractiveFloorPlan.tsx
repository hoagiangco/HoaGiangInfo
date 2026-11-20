'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
  FiArrowLeft,
  FiMapPin,
  FiInfo,
  FiX,
} from 'react-icons/fi';
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
  token?: string;
}

export default function InteractiveFloorPlan({
  floorPlan,
  token,
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
      setZoom((prev) => (prev === 1 ? 2 : 1));
      lastTapRef.current = 0;
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
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#EBDDC3]">
        <div className="flex items-center gap-3">
          {token && (
            <Link
              href={`/${token}/floor-plan`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 hover:text-[#866526] transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Sơ đồ</span>
            </Link>
          )}
          <span className="text-stone-300">/</span>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {floorPlan.name}
          </h1>
        </div>

        {/* Controls Toolbar */}
        {!isFullscreen && (
          <div className="flex items-center gap-2 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 self-start sm:self-auto">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
              title="Thu nhỏ"
            >
              -
            </button>
            <span className="text-xs font-mono text-stone-600 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
              className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold transition-colors shadow-sm"
              title="Phóng to"
            >
              +
            </button>
            <button
              onClick={rotateContent}
              className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-sm"
              title="Xoay sơ đồ"
            >
              <FiRotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded-lg bg-[#FAF7EE] text-[#866526] border border-[#E6D3A7] hover:bg-[#866526] hover:text-white flex items-center justify-center transition-colors"
              title="Toàn màn hình"
            >
              <FiMaximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {floorPlan.description && (
        <p className="text-stone-600 text-sm max-w-3xl leading-relaxed italic">
          &ldquo;{floorPlan.description}&rdquo;
        </p>
      )}

      {/* Fullscreen Overlay Bar */}
      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0B1120] text-white px-6 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#B58E38]" />
            <h3 className="font-serif text-sm font-semibold tracking-wide">
              {floorPlan.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-xs"
            >
              -
            </button>
            <span className="text-xs font-mono px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-xs"
            >
              +
            </button>
            <button
              onClick={rotateContent}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center"
            >
              <FiRotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-7 h-7 bg-[#866526] text-white rounded-lg flex items-center justify-center"
            >
              <FiMinimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Floor Plan Container */}
      <div
        ref={containerRef}
        className={`${
          isFullscreen
            ? 'fixed inset-0 z-40 bg-stone-900 overflow-auto pt-14'
            : 'bg-white rounded-2xl border border-[#EBDDC3] shadow-luxury p-4 relative overflow-hidden flex flex-col justify-center'
        }`}
        style={!isFullscreen ? { height: 'calc(100vh - 240px)', minHeight: '400px' } : {}}
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
                className="w-full h-full rounded-xl"
                title="Floor Plan PDF"
              />
            ) : (
              <img
                src={floorPlan.imageUrl}
                alt={floorPlan.name}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl select-none"
                draggable={false}
              />
            )}

            {/* Clickable room hotspots */}
            {floorPlan.rooms.map((room) => {
              if (!room.x || !room.y || !room.width || !room.height) return null;
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  className={`absolute rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#B58E38] bg-[#B58E38]/40 ring-4 ring-[#B58E38]/20 animate-pulse'
                      : 'border border-[#B58E38]/60 bg-[#B58E38]/15 hover:bg-[#B58E38]/30'
                  }`}
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
                  title={`Phòng ${room.number}`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    {room.number}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="aspect-video bg-stone-50 rounded-xl flex items-center justify-center border border-dashed border-stone-200">
            <p className="text-stone-400 text-xs font-serif">
              {getTranslation(language, 'no_floor_plan') || 'Không có hình ảnh sơ đồ'}
            </p>
          </div>
        )}
      </div>

      {/* Selected Room Detail Card */}
      {selectedRoom && (
        <div className="bg-[#FAF7EE] rounded-2xl p-5 border border-[#E6D3A7] shadow-card flex items-start justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E6D3A7] text-[#866526] flex items-center justify-center shrink-0">
              <FiMapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Phòng {selectedRoom.number}
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#866526] bg-white border border-[#E6D3A7] px-2 py-0.5 rounded-full">
                  {selectedRoom.type}
                </span>
              </div>
              {selectedRoom.description ? (
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {selectedRoom.description}
                </p>
              ) : (
                <p className="text-xs text-stone-500 mt-1 italic">
                  Không gian nghỉ dưỡng tiện nghi, tiêu chuẩn 4 sao quốc tế.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedRoom(null)}
            className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors shrink-0"
            title="Đóng"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
