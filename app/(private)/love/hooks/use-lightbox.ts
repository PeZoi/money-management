'use client';

import * as React from 'react';
import { getOptimizedCloudinaryUrl, isMediaVideo } from '@/lib/utils';

interface UseLightboxProps {
  activePreviewUrls: string[] | null;
  setActivePreviewUrls: (urls: string[] | null) => void;
  activePreviewIdx: number;
  setActivePreviewIdx: React.Dispatch<React.SetStateAction<number>>;
  zoomActive: boolean;
  setZoomActive: React.Dispatch<React.SetStateAction<boolean>>;
}

// Tính khoảng cách giữa 2 ngón tay
function getPinchDistance(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function useLightbox({
  activePreviewUrls,
  setActivePreviewUrls,
  activePreviewIdx,
  setActivePreviewIdx,
  zoomActive,
  setZoomActive,
}: UseLightboxProps) {
  // Ref đến DOM wrapper để thao tác transform trực tiếp, tránh re-render
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  // === Toàn bộ touch state lưu bằng ref để tránh re-render khi swipe ===
  const touchRef = React.useRef({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
    swipeDir: null as 'horizontal' | 'vertical' | null,
    // Pinch
    isPinching: false,
    pinchStartDist: 0,
    pinchStartScale: 1,
    // Pan khi zoom
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panOffsetStartX: 0,
    panOffsetStartY: 0,
  });

  // Zoom & Pan state (chỉ dùng state cho giá trị cần render lại UI)
  const [zoomScale, setZoomScale] = React.useState(1);
  const [panOffset, setPanOffset] = React.useState({ x: 0, y: 0 });
  // Refs mirror cho zoom/pan để đọc nhanh trong touch handler mà không bị stale closure
  const zoomScaleRef = React.useRef(1);
  const panOffsetRef = React.useRef({ x: 0, y: 0 });

  const lastTapRef = React.useRef<number>(0);
  const rafRef = React.useRef<number | null>(null);

  // Sync state → ref
  React.useEffect(() => { zoomScaleRef.current = zoomScale; }, [zoomScale]);
  React.useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  // Reset zoom khi chuyển ảnh
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoomScale(1);
    zoomScaleRef.current = 1;
    setPanOffset({ x: 0, y: 0 });
    panOffsetRef.current = { x: 0, y: 0 };
    setZoomActive(false);
    // Reset transform trực tiếp trên DOM
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = 'translate3d(0,0,0) scale(1)';
      wrapperRef.current.style.transition = 'none';
      wrapperRef.current.style.opacity = '1';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePreviewIdx]);

  // Đồng bộ zoomActive → reset nếu cần
  React.useEffect(() => {
    if (!zoomActive && zoomScaleRef.current !== 1) {
      setZoomScale(1);
      zoomScaleRef.current = 1;
      setPanOffset({ x: 0, y: 0 });
      panOffsetRef.current = { x: 0, y: 0 };
    }
  }, [zoomActive]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activePreviewUrls) return;
      if (e.key === 'Escape') {
        setActivePreviewUrls(null);
      } else if (e.key === 'ArrowRight') {
        if (activePreviewIdx < activePreviewUrls.length - 1) {
          setActivePreviewIdx(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (activePreviewIdx > 0) {
          setActivePreviewIdx(prev => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePreviewUrls, activePreviewIdx, setActivePreviewUrls, setActivePreviewIdx]);

  // Preload ảnh liền kề (next và prev) để khi bấm chuyển ảnh hiển thị tức thì (0ms latency)
  React.useEffect(() => {
    if (!activePreviewUrls || activePreviewUrls.length <= 1) return;

    const urlsToPreload = [
      activePreviewUrls[activePreviewIdx + 1],
      activePreviewUrls[activePreviewIdx - 1],
      activePreviewUrls[activePreviewIdx + 2],
    ].filter(Boolean);

    urlsToPreload.forEach((url) => {
      if (!isMediaVideo(url)) {
        const img = new Image();
        img.src = getOptimizedCloudinaryUrl(url, { width: 1600 });
      }
    });
  }, [activePreviewUrls, activePreviewIdx]);

  // === Hàm áp dụng transform trực tiếp lên DOM (zero re-render) ===
  const applyTransform = React.useCallback((
    translateX: number,
    translateY: number,
    scale: number,
    transition: string,
    opacity?: number
  ) => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
    el.style.transition = transition;
    if (opacity !== undefined) {
      el.style.opacity = String(opacity);
    } else {
      el.style.opacity = '1';
    }
  }, []);

  // === Touch Handlers ===
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;

    // Pinch: 2 ngón tay bắt đầu
    if (e.touches.length === 2) {
      t.isPinching = true;
      t.isSwiping = false;
      t.pinchStartDist = getPinchDistance(e.touches);
      t.pinchStartScale = zoomScaleRef.current;
      return;
    }

    // 1 ngón
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const isZoomed = zoomScaleRef.current > 1.05;

      if (isZoomed) {
        // Pan khi đã zoom
        t.isPanning = true;
        t.panStartX = touch.clientX;
        t.panStartY = touch.clientY;
        t.panOffsetStartX = panOffsetRef.current.x;
        t.panOffsetStartY = panOffsetRef.current.y;
        return;
      }

      // Swipe bình thường
      t.startX = touch.clientX;
      t.startY = touch.clientY;
      t.deltaX = 0;
      t.deltaY = 0;
      t.isSwiping = true;
      t.swipeDir = null;
    }
  }, []);

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;

    // Pinch move
    if (e.touches.length === 2 && t.isPinching) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const touches = e.touches;

      rafRef.current = requestAnimationFrame(() => {
        const currentDist = getPinchDistance(touches);
        const scaleFactor = currentDist / t.pinchStartDist;
        const newScale = Math.min(Math.max(t.pinchStartScale * scaleFactor, 0.5), 5);

        zoomScaleRef.current = newScale;
        const po = panOffsetRef.current;
        applyTransform(po.x, po.y, newScale, 'none');

        if (newScale > 1.05) {
          setZoomActive(true);
        }
      });
      return;
    }

    // Pan khi zoom
    if (e.touches.length === 1 && t.isPanning && zoomScaleRef.current > 1.05) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      rafRef.current = requestAnimationFrame(() => {
        const dx = clientX - t.panStartX;
        const dy = clientY - t.panStartY;
        const newPanX = t.panOffsetStartX + dx;
        const newPanY = t.panOffsetStartY + dy;

        panOffsetRef.current = { x: newPanX, y: newPanY };
        applyTransform(newPanX, newPanY, zoomScaleRef.current, 'none');
      });
      return;
    }

    // Swipe move (1 ngón, chưa zoom)
    if (!t.isSwiping) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;

    rafRef.current = requestAnimationFrame(() => {
      const deltaX = clientX - t.startX;
      const deltaY = clientY - t.startY;
      t.deltaX = deltaX;
      t.deltaY = deltaY;

      if (!t.swipeDir) {
        t.swipeDir = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }

      // Áp dụng transform trực tiếp lên DOM, không qua setState
      if (t.swipeDir === 'horizontal') {
        applyTransform(deltaX, 0, 1, 'none');
      } else if (t.swipeDir === 'vertical') {
        const opacity = Math.max(0.3, 1 - Math.abs(deltaY) / 300);
        applyTransform(0, deltaY, 1, 'none', opacity);
      }
    });
  }, [applyTransform, setZoomActive]);

  const handleTouchEnd = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const t = touchRef.current;

    // Kết thúc pinch
    if (t.isPinching) {
      t.isPinching = false;
      const finalScale = zoomScaleRef.current;
      if (finalScale < 1.05) {
        // Snap về 1 với animation mượt
        zoomScaleRef.current = 1;
        panOffsetRef.current = { x: 0, y: 0 };
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        setZoomActive(false);
        applyTransform(0, 0, 1, 'transform 0.2s ease-out');
      } else {
        setZoomScale(finalScale);
        setPanOffset({ ...panOffsetRef.current });
      }
      return;
    }

    // Kết thúc pan
    if (t.isPanning) {
      t.isPanning = false;
      setPanOffset({ ...panOffsetRef.current });
      return;
    }

    // Kết thúc swipe
    if (!t.isSwiping || !activePreviewUrls) return;
    t.isSwiping = false;

    const threshold = 50;

    if (t.swipeDir === 'horizontal') {
      if (t.deltaX < -threshold && activePreviewIdx < activePreviewUrls.length - 1) {
        // Swipe sang trái → ảnh tiếp theo: animate ra khỏi màn hình rồi chuyển
        applyTransform(-window.innerWidth, 0, 1, 'transform 0.15s ease-out');
        setTimeout(() => {
          setActivePreviewIdx(prev => prev + 1);
        }, 100);
        return;
      } else if (t.deltaX > threshold && activePreviewIdx > 0) {
        // Swipe sang phải → ảnh trước: animate ra khỏi màn hình rồi chuyển
        applyTransform(window.innerWidth, 0, 1, 'transform 0.15s ease-out');
        setTimeout(() => {
          setActivePreviewIdx(prev => prev - 1);
        }, 100);
        return;
      }
    } else if (t.swipeDir === 'vertical') {
      if (Math.abs(t.deltaY) > threshold) {
        // Vuốt dọc → đóng lightbox với animation fade-out
        const dir = t.deltaY > 0 ? 1 : -1;
        applyTransform(0, dir * window.innerHeight * 0.3, 1, 'transform 0.15s ease-out, opacity 0.15s ease-out', 0);
        setTimeout(() => {
          setActivePreviewUrls(null);
        }, 120);
        return;
      }
    }

    // Snap về vị trí ban đầu (swipe chưa đủ ngưỡng)
    applyTransform(0, 0, 1, 'transform 0.2s ease-out');
  }, [activePreviewUrls, activePreviewIdx, setActivePreviewIdx, setActivePreviewUrls, setZoomActive, applyTransform]);

  // Double-tap toggle zoom 2.5x / reset
  const handleImageClick = React.useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_PRESS_DELAY) {
      if (zoomScaleRef.current > 1.05) {
        // Đang zoom → reset
        zoomScaleRef.current = 1;
        panOffsetRef.current = { x: 0, y: 0 };
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
        setZoomActive(false);
        applyTransform(0, 0, 1, 'transform 0.25s ease-out');
      } else {
        // Chưa zoom → zoom 2.5x
        zoomScaleRef.current = 2.5;
        panOffsetRef.current = { x: 0, y: 0 };
        setZoomScale(2.5);
        setPanOffset({ x: 0, y: 0 });
        setZoomActive(true);
        applyTransform(0, 0, 2.5, 'transform 0.25s ease-out');
      }
    }
    lastTapRef.current = now;
  }, [setZoomActive, applyTransform]);

  return {
    wrapperRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleImageClick,
    zoomScale,
  };
}
