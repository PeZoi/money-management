'use client';

import { useRef, useEffect } from 'react';

/**
 * Custom hook giúp tạo nút Float Button (FAB) kéo thả (Draggable) mượt mà trên di động.
 * Sử dụng requestAnimationFrame và translate3d để tối ưu hiệu năng GPU (hardware acceleration).
 */
export function useDraggable() {
  const ref = useRef<HTMLButtonElement>(null);
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hasMoved: false,
  });

  const handleDragStart = (clientX: number, clientY: number) => {
    dragInfo.current.isDragging = true;
    dragInfo.current.hasMoved = false;
    dragInfo.current.startX = clientX - dragInfo.current.currentX;
    dragInfo.current.startY = clientY - dragInfo.current.currentY;
  };

  useEffect(() => {
    let animationFrameId: number | null = null;

    const handleDragMove = (clientX: number, clientY: number) => {
      if (!dragInfo.current.isDragging) return;

      const dx = clientX - dragInfo.current.startX;
      const dy = clientY - dragInfo.current.startY;

      // Nếu di chuyển vượt quá 4px, coi là kéo và không kích hoạt click
      if (Math.abs(dx - dragInfo.current.currentX) > 4 || Math.abs(dy - dragInfo.current.currentY) > 4) {
        dragInfo.current.hasMoved = true;
      }

      // Giới hạn nút trong Viewport để không bị kéo ra ngoài màn hình
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      // Thiết lập biên di chuyển hợp lý dựa trên kích thước màn hình
      const minX = -screenWidth + 80;
      const maxX = 16;
      const minY = -screenHeight + 180;
      const maxY = 80;

      const boundedX = Math.max(minX, Math.min(maxX, dx));
      const boundedY = Math.max(minY, Math.min(maxY, dy));

      dragInfo.current.currentX = boundedX;
      dragInfo.current.currentY = boundedY;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Sử dụng requestAnimationFrame để đồng bộ với tần số quét của màn hình
      animationFrameId = requestAnimationFrame(() => {
        if (ref.current) {
          // translate3d kích hoạt Hardware Acceleration của GPU giúp kéo cực kỳ mượt mà
          ref.current.style.transform = `translate3d(${boundedX}px, ${boundedY}px, 0)`;
        }
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragInfo.current.isDragging) return;
      handleDragMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragInfo.current.isDragging) return;
      if (e.touches.length > 0) {
        // Ngăn cuộn trang web khi đang drag nút để tránh giật lag
        if (e.cancelable) {
          e.preventDefault();
        }
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onDragEnd = () => {
      dragInfo.current.isDragging = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchend', onDragEnd);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return {
    ref,
    dragInfo,
    handleDragStart,
  };
}
