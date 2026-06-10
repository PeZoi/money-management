'use client';

import { LazyMotion, domMax } from 'framer-motion';

interface FramerMotionProviderProps {
  children: React.ReactNode;
}

/**
 * Provider cấu hình LazyMotion cho Framer Motion toàn cục.
 * Sử dụng 'domMax' để hỗ trợ đầy đủ các tính năng kéo thả (drag/drop) và layout animation.
 * Chế độ 'strict' đảm bảo các lập trình viên sử dụng 'm' component để tối ưu bundle size.
 */
export function FramerMotionProvider({ children }: FramerMotionProviderProps) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
