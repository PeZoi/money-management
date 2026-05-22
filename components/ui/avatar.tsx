'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  width?: number;
  height?: number;
}

export function Avatar({ src, name, className, width = 36, height = 36 }: AvatarProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  // Reset state trực tiếp trong render pass khi src thay đổi
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsLoaded(false);
    setHasError(false);
  }

  // Lấy 1 chữ cái đại diện cho tên (theo yêu cầu của user)
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  // Điều kiện để thử tải ảnh
  const showImage = src && !hasError;

  return (
    <div
      className={cn(
        // Thiết lập fallback màu primary nhạt (bg-primary/10 text-primary)
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-primary font-semibold select-none',
        className
      )}
      style={{
        width,
        height,
        // Tự động điều chỉnh kích thước chữ cái fallback theo chiều rộng avatar
        fontSize: `${Math.max(12, width / 2.5)}px`,
      }}
    >
      {/* 1 chữ cái đại diện cho tên */}
      <span>{initial}</span>

      {/* Ảnh đại diện nếu có link và không lỗi */}
      {showImage && (
        <Image
          src={src}
          alt={name ?? 'Avatar'}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-200',
            // Chỉ hiển thị ảnh khi đã load xong, nếu đang load hoặc lỗi thì ẩn để hiện fallback phía dưới
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}
    </div>
  );
}
