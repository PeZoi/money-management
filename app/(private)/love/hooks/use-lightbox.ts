'use client';

import * as React from 'react';

interface UseLightboxProps {
  activePreviewUrls: string[] | null;
  setActivePreviewUrls: (urls: string[] | null) => void;
  activePreviewIdx: number;
  setActivePreviewIdx: React.Dispatch<React.SetStateAction<number>>;
  zoomActive: boolean;
  setZoomActive: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useLightbox({
  activePreviewUrls,
  setActivePreviewUrls,
  activePreviewIdx,
  setActivePreviewIdx,
  zoomActive,
  setZoomActive,
}: UseLightboxProps) {
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [swipeDir, setSwipeDir] = React.useState<'horizontal' | 'vertical' | null>(null);
  const lastTapRef = React.useRef<number>(0);

  // Keyboard navigation cho Lightbox
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePreviewUrls) return;
      if (e.key === 'Escape') {
        setActivePreviewUrls(null);
      } else if (e.key === 'ArrowRight') {
        if (activePreviewIdx < activePreviewUrls.length - 1) {
          setActivePreviewIdx(prev => prev + 1);
          setZoomActive(false);
        }
      } else if (e.key === 'ArrowLeft') {
        if (activePreviewIdx > 0) {
          setActivePreviewIdx(prev => prev - 1);
          setZoomActive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewUrls, activePreviewIdx, setActivePreviewUrls, setActivePreviewIdx, setZoomActive]);

  // Touch Gestures cho Lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomActive) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchDelta({ x: 0, y: 0 });
    setIsSwiping(true);
    setSwipeDir(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    let currentDir = swipeDir;
    if (!currentDir) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentDir = 'horizontal';
      } else {
        currentDir = 'vertical';
      }
      setSwipeDir(currentDir);
    }

    setTouchDelta({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !isSwiping || !activePreviewUrls) return;
    setIsSwiping(false);

    const threshold = 60;

    if (swipeDir === 'horizontal') {
      if (touchDelta.x < -threshold) {
        if (activePreviewIdx < activePreviewUrls.length - 1) {
          setActivePreviewIdx(prev => prev + 1);
          setZoomActive(false);
        }
      } else if (touchDelta.x > threshold) {
        if (activePreviewIdx > 0) {
          setActivePreviewIdx(prev => prev - 1);
          setZoomActive(false);
        }
      }
    } else if (swipeDir === 'vertical') {
      if (Math.abs(touchDelta.y) > threshold) {
        setActivePreviewUrls(null);
      }
    }

    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
    setSwipeDir(null);
  };

  const getTransformStyle = () => {
    if (!isSwiping) return undefined;
    if (swipeDir === 'horizontal') {
      return { transform: `translateX(${touchDelta.x}px)`, transition: 'none' };
    }
    if (swipeDir === 'vertical') {
      return { transform: `translateY(${touchDelta.y}px)`, opacity: Math.max(0.3, 1 - Math.abs(touchDelta.y) / 300), transition: 'none' };
    }
    return undefined;
  };

  const handleImageClick = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      setZoomActive(prev => !prev);
    }
    lastTapRef.current = now;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getTransformStyle,
    handleImageClick,
  };
}
