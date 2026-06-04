'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
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
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getTransformStyle,
    handleImageClick,
  } = useLightbox({
    activePreviewUrls,
    setActivePreviewUrls,
    activePreviewIdx,
    setActivePreviewIdx,
    zoomActive,
    setZoomActive,
  });
  if (!activePreviewUrls || activePreviewUrls.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center select-none animate-fade-in touch-none">
      {/* Nút đóng ở góc trên bên phải */}
      <button
        onClick={() => setActivePreviewUrls(null)}
        className="absolute top-4 right-4 z-50 p-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full transition-colors cursor-pointer border border-white/5 active:scale-95 flex items-center justify-center"
        title="Đóng preview"
      >
        <X className="size-5" />
      </button>

      {/* Chỉ số ảnh hiện tại */}
      {activePreviewUrls.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-zinc-900/60 text-white text-xs font-extrabold tracking-wider rounded-full border border-white/5 shadow-inner">
          {activePreviewIdx + 1} / {activePreviewUrls.length}
        </div>
      )}

      {/* Vùng xem ảnh ở trung tâm */}
      <div
        className="relative w-full flex-1 flex items-center justify-center p-4 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nút Previous */}
        {activePreviewUrls.length > 1 && activePreviewIdx > 0 && (
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

        {/* Ảnh chính */}
        <div
          style={getTransformStyle()}
          className="flex items-center justify-center max-w-full max-h-[85vh] transition-transform duration-300"
          onClick={handleImageClick}
        >
          <img
            src={activePreviewUrls[activePreviewIdx]}
            alt="Kỷ niệm preview"
            className={cn(
              "max-w-full max-h-[85vh] select-none pointer-events-none rounded-sm transition-transform ease-out duration-300",
              zoomActive
                ? "scale-175 cursor-zoom-out object-contain overflow-auto"
                : "scale-100 object-contain"
            )}
          />
        </div>

        {/* Nút Next */}
        {activePreviewUrls.length > 1 && activePreviewIdx < activePreviewUrls.length - 1 && (
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
