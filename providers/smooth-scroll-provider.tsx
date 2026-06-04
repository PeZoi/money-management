'use client';

import { ReactLenis } from 'lenis/react';

/**
 * Provider cuộn mượt toàn cục sử dụng Lenis.
 *
 * Cách hoạt động:
 * - `root` prop: Lenis sẽ attach vào thẻ <html> thay vì tạo wrapper <div>,
 *   nhờ đó cuộn toàn trang mà không phá vỡ layout hiện có.
 * - `autoRaf: true`: Tự động chạy requestAnimationFrame loop.
 *
 * Tránh xung đột với Radix UI overlay:
 * - Lenis tự động nhận diện `data-lenis-prevent` để dừng cuộn
 *   trong các vùng con như Dialog/Drawer/Sheet/Popover/Select.
 * - CSS global đã thêm `data-lenis-prevent` cho tất cả Radix overlay
 *   thông qua selector `[data-radix-popper-content-wrapper]`, v.v.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Cho phép cuộn lồng trong các phần tử con có overflow riêng (bảng, sidebar, v.v.)
        prevent: (node: HTMLElement) => {
          // Không can thiệp cuộn bên trong các phần tử Radix overlay
          // (Dialog, Drawer, Sheet, Select, DropdownMenu, Popover)
          return (
            node.closest('[data-radix-popper-content-wrapper]') !== null ||
            node.closest('[data-slot="sheet-content"]') !== null ||
            node.closest('[data-slot="drawer-content"]') !== null ||
            node.closest('[data-slot="dialog-content"]') !== null ||
            node.closest('[data-lenis-prevent]') !== null
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}
