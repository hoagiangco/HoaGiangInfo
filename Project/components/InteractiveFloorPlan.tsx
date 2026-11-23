'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FiMaximize2,
  FiMinimize2,
  FiRotateCw,
  FiArrowLeft,
  FiMapPin,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import { useLanguage } from './LanguageProvider';
import { getTranslation, translateCategory } from '@/lib/i18n';
import {
  getExactTranslation,
  getLocalizedValue,
  pickLocalizedResource,
  type FloorPlanTranslationFields,
  type RoomTranslationFields,
} from '@/lib/translations';

interface Room {
  id: string;
  number: string;
  type: string;
  description: string | null;
  translations?: unknown;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
}

interface FloorPlan {
  id: string;
  name: string;
  description: string | null;
  translations?: unknown;
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const mapByLang = useMemo(() => {
    const enUrl = getExactTranslation<FloorPlanTranslationFields>(
      'en',
      floorPlan.translations,
      'imageUrl'
    );
    const enType = getExactTranslation<FloorPlanTranslationFields>(
      'en',
      floorPlan.translations,
      'fileType'
    );
    const zhUrl = getExactTranslation<FloorPlanTranslationFields>(
      'zh',
      floorPlan.translations,
      'imageUrl'
    );
    const zhType = getExactTranslation<FloorPlanTranslationFields>(
      'zh',
      floorPlan.translations,
      'fileType'
    );

    return {
      vi: floorPlan.imageUrl
        ? { url: floorPlan.imageUrl, fileType: floorPlan.fileType || 'image' }
        : null,
      en: enUrl
        ? {
            url: enUrl,
            fileType:
              enType || (enUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
          }
        : null,
      zh: zhUrl
        ? {
            url: zhUrl,
            fileType:
              zhType || (zhUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'),
          }
        : null,
    };
  }, [floorPlan.imageUrl, floorPlan.fileType, floorPlan.translations]);

  const activeMap = useMemo(
    () => pickLocalizedResource(language, mapByLang).value,
    [language, mapByLang]
  );

  const localizedName = getLocalizedValue<FloorPlanTranslationFields>(
    language,
    floorPlan.name,
    floorPlan.translations,
    'name'
  );
  const localizedDesc = getLocalizedValue<FloorPlanTranslationFields>(
    language,
    floorPlan.description,
    floorPlan.translations,
    'description'
  );

  function updateZoom(next: number) {
    const clamped = Math.max(0.5, Math.min(3, Number(next.toFixed(2))));
    setZoom(clamped);
    if (clamped <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }

  function resetView() {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  }

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

  function handleTouchStart(e: React.TouchEvent) {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapRef.current;

    if (tapLength < 300 && tapLength > 0 && e.touches.length === 1) {
      e.preventDefault();
      updateZoom(zoom === 1 ? 2 : 1);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = currentTime;

    if (zoom > 1 && e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (zoom > 1 && isDragging && e.touches.length === 1) {
      const t = e.touches[0];
      setPan({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
    }
  }

  function handleTouchEnd() {
    setIsDragging(false);
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging || zoom <= 1) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom((prev) => {
        const next = Math.max(0.5, Math.min(3, Number((prev + delta).toFixed(2))));
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
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

  const selectedRoomDesc = selectedRoom
    ? getLocalizedValue<RoomTranslationFields>(
        language,
        selectedRoom.description,
        selectedRoom.translations,
        'description'
      )
    : '';

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Top Header & Touch-Friendly Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-[#D5C9B2]">
        <div className="flex items-center gap-2.5 min-w-0">
          {token && (
            <Link
              href={`/${token}/floor-plan`}
              aria-label={getTranslation(language, 'floor_plan_back')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl bg-white border border-[#CFC3AC] text-xs font-bold uppercase tracking-wider text-slate-900 hover:bg-[#0F172A] hover:text-[#E8CA7A] hover:border-[#0F172A] shadow-sm transition-colors shrink-0 active:scale-95"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {getTranslation(language, 'floor_plan_back')}
              </span>
            </Link>
          )}
          <h1 className="font-serif text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
            {localizedName}
          </h1>
        </div>

        {/* High-Contrast Touch Controls Toolbar */}
        {!isFullscreen && (
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#CFC3AC] shadow-sm self-start sm:self-auto">
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.25)}
              className="w-8 h-8 rounded-lg bg-[#F3EFE6] hover:bg-slate-200 text-slate-900 flex items-center justify-center text-base font-bold transition-colors"
              title={getTranslation(language, 'zoom_out')}
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="text-xs font-mono font-bold text-slate-900 min-w-[42px] h-8 px-1 rounded-lg hover:bg-slate-100 transition-colors"
              title={getTranslation(language, 'reset_zoom')}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.25)}
              className="w-8 h-8 rounded-lg bg-[#F3EFE6] hover:bg-slate-200 text-slate-900 flex items-center justify-center text-base font-bold transition-colors"
              title={getTranslation(language, 'zoom_in')}
            >
              +
            </button>
            {(zoom !== 1 || rotation !== 0) && (
              <button
                type="button"
                onClick={resetView}
                className="w-8 h-8 rounded-lg bg-[#F3EFE6] hover:bg-slate-200 text-[#6E4E12] flex items-center justify-center transition-colors"
                title={getTranslation(language, 'reset_view')}
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={rotateContent}
              className="w-8 h-8 rounded-lg bg-[#F3EFE6] hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors"
              title={getTranslation(language, 'floor_plan_rotate_tooltip')}
            >
              <FiRotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg bg-[#0F172A] text-[#E8CA7A] hover:bg-slate-800 flex items-center justify-center transition-colors"
              title={getTranslation(language, 'fullscreen')}
            >
              <FiMaximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {localizedDesc && (
        <p className="text-slate-700 text-xs sm:text-sm max-w-3xl leading-relaxed">
          {localizedDesc}
        </p>
      )}

      {/* Fullscreen Overlay Bar */}
      {isFullscreen && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#E8CA7A] shrink-0" />
            <h3 className="font-serif text-sm font-bold tracking-wide truncate">
              {localizedName}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.25)}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-base font-bold"
              title={getTranslation(language, 'zoom_out')}
            >
              −
            </button>
            <span className="text-xs font-mono font-bold px-1.5">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.25)}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-base font-bold"
              title={getTranslation(language, 'zoom_in')}
            >
              +
            </button>
            <button
              type="button"
              onClick={rotateContent}
              className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center"
              title={getTranslation(language, 'rotate')}
            >
              <FiRotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-9 h-9 bg-[#E8CA7A] text-[#0F172A] rounded-lg flex items-center justify-center"
              title={getTranslation(language, 'exit_fullscreen')}
            >
              <FiMinimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Floor Plan Container */}
      <div
        ref={containerRef}
        className={`${
          isFullscreen
            ? 'fixed inset-0 z-40 bg-slate-950 overflow-hidden pt-14 flex items-center justify-center'
            : 'bg-white rounded-2xl border border-[#CFC3AC] shadow-sm p-2.5 sm:p-4 relative overflow-hidden flex flex-col justify-center'
        }`}
        style={
          !isFullscreen
            ? { height: 'calc(100vh - 280px)', minHeight: '340px', maxHeight: '760px' }
            : {}
        }
      >
        {activeMap ? (
          <div
            ref={imageRef}
            className={`relative flex items-center justify-center w-full h-full touch-none ${
              zoom > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-crosshair'
            }`}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            onClick={handleImageClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {activeMap.fileType === 'pdf' ? (
              <iframe
                src={activeMap.url}
                className="w-full h-full rounded-xl"
                title={localizedName}
              />
            ) : (
              <img
                src={activeMap.url}
                alt={localizedName}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl select-none"
                draggable={false}
              />
            )}

            {/* High-Contrast Clickable Room Hotspots */}
            {floorPlan.rooms.map((room) => {
              if (!room.x || !room.y || !room.width || !room.height) return null;
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  className={`absolute rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'border-2 border-[#0F172A] bg-[#E8CA7A]/60 ring-4 ring-[#0F172A]/25'
                      : 'border border-[#6E4E12]/80 bg-[#E8CA7A]/25 hover:bg-[#E8CA7A]/45'
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
                  title={getTranslation(language, 'floor_plan_room_label', {
                    number: room.number,
                  })}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0F172A] text-[#E8CA7A] border border-[#E8CA7A]/50 text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                    {room.number}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="aspect-video bg-[#F3EFE6] rounded-xl flex items-center justify-center border border-dashed border-[#CFC3AC]">
            <p className="text-slate-700 text-sm font-serif font-semibold">
              {getTranslation(language, 'no_floor_plan')}
            </p>
          </div>
        )}
      </div>

      {/* Subtle Gesture Hint */}
      {activeMap && activeMap.fileType !== 'pdf' && (
        <p className="text-[11px] font-semibold text-slate-600 text-center">
          {getTranslation(language, 'floor_plan_gesture_hint')}
        </p>
      )}

      {/* High-Contrast Selected Room Detail Card */}
      {selectedRoom && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#0F172A] shadow-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#E8CA7A] flex items-center justify-center shrink-0">
              <FiMapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-base sm:text-lg font-bold text-slate-900">
                  {getTranslation(language, 'floor_plan_room_label', {
                    number: selectedRoom.number,
                  })}
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E4E12] bg-[#FBF6E8] border border-[#C9B483] px-2.5 py-0.5 rounded-full">
                  {translateCategory(language, 'room_type_', selectedRoom.type)}
                </span>
              </div>
              {selectedRoomDesc ? (
                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                  {selectedRoomDesc}
                </p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">
                  {getTranslation(language, 'floor_plan_room_default_desc')}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedRoom(null)}
            className="w-9 h-9 rounded-xl bg-[#F3EFE6] hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors shrink-0"
            title={getTranslation(language, 'close')}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
