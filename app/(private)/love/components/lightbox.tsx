'use client';

import * as React from 'react';
import { cn, isMediaVideo } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { useLightbox } from '../hooks/use-lightbox';

interface LightboxProps {
  activePreviewUrls: string[] | null;
  setActivePreviewUrls: (urls: string[] | null) => void;
  activePreviewIdx: number;
  setActivePreviewIdx: React.Dispatch<React.SetStateAction<number>>;
  zoomActive: boolean;
  setZoomActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Lightbox({
  activePreviewUrls,
  setActivePreviewUrls,
  activePreviewIdx,
  setActivePreviewIdx,
  zoomActive,
  setZoomActive,
}: LightboxProps) {
  const {
    wrapperRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleImageClick,
    zoomScale,
  } = useLightbox({
    activePreviewUrls,
    setActivePreviewUrls,
    activePreviewIdx,
    setActivePreviewIdx,
    zoomActive,
    setZoomActive,
  });
  if (!activePreviewUrls || activePreviewUrls.length === 0) return null;

  const currentUrl = activePreviewUrls[activePreviewIdx];
  const isVid = isMediaVideo(currentUrl);
  const isZoomed = zoomScale > 1.05;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center select-none animate-fade-in touch-none">
      {/* Nút đóng */}
      <button
        onClick={() => setActivePreviewUrls(null)}
        className="absolute top-4 right-4 z-50 p-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-colors cursor-pointer border border-white/5 active:scale-95 flex items-center justify-center"
        title="Đóng preview"
      >
        <X className="size-5" />
      </button>

      {/* Chỉ số tệp */}
      {activePreviewUrls.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-zinc-900/60 text-white text-xs font-extrabold tracking-wider rounded-full border border-white/5 shadow-inner">
          {activePreviewIdx + 1} / {activePreviewUrls.length}
        </div>
      )}

      {/* Gợi ý zoom cho mobile */}
      {!isZoomed && !isVid && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-zinc-900/50 text-white/60 text-[10px] font-medium tracking-wide rounded-full border border-white/5 animate-pulse pointer-events-none md:hidden">
          Chụm 2 ngón để phóng to · Nhấn đúp để zoom
        </div>
      )}

      {/* Vùng xem media */}
      <div
        className={cn(
          "relative w-full flex-1 flex items-center justify-center p-4",
          isZoomed ? "overflow-auto" : "overflow-hidden"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nút Previous (ẩn khi zoom) */}
        {activePreviewUrls.length > 1 && activePreviewIdx > 0 && !isZoomed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActivePreviewIdx(prev => prev - 1);
              setZoomActive(false);
            }}
            className="absolute left-4 z-40 hidden md:flex items-center justify-center p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-all cursor-pointer border border-white/5 active:scale-95 shadow-lg"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* Media wrapper - transform thao tác trực tiếp qua ref */}
        <div
          ref={wrapperRef}
          className="flex items-center justify-center max-w-full max-h-[85vh] transform-gpu will-change-transform"
          style={{ transform: 'translate3d(0,0,0) scale(1)' }}
          onClick={isVid ? undefined : handleImageClick}
        >
          {isVid ? (
            <video
              src={currentUrl}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
          ) : (
            <img
              src={currentUrl}
              alt="Kỷ niệm preview"
              draggable={false}
              className="max-w-full max-h-[85vh] select-none pointer-events-none rounded-sm object-contain transform-gpu"
            />
          )}
        </div>

        {/* Nút Next (ẩn khi zoom) */}
        {activePreviewUrls.length > 1 && activePreviewIdx < activePreviewUrls.length - 1 && !isZoomed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActivePreviewIdx(prev => prev + 1);
              setZoomActive(false);
            }}
            className="absolute right-4 z-40 hidden md:flex items-center justify-center p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-all cursor-pointer border border-white/5 active:scale-95 shadow-lg"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>
    </div>
  );
}
