'use client';

import { createElement } from 'react';

import { getLucideIconComponent } from '@/components/icons/icon-picker';
import { cn } from '@/lib/utils';

type Props = {
  /** Ký tự emoji (ví dụ "🍔") hoặc tên Lucide icon (ví dụ "Wallet"). */
  name?: string | null;
  className?: string;
};

/**
 * Kiểm tra chuỗi có chứa ít nhất một ký tự emoji Unicode hay không.
 * Bao phủ các emoji phổ biến: emoticons, symbols, pictographs, transport, flags, v.v.
 */
function isEmojiString(str: string): boolean {
  // Pattern bao phủ hầu hết emoji Unicode bao gồm cả ZWJ sequences và modifier
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u;
  return emojiRegex.test(str);
}

/**
 * Ánh xạ các class kích thước (dành cho SVG) sang class font-size phù hợp cho emoji,
 * giúp emoji hiển thị to, rõ nét và không bị bóp nghẹt kích thước.
 */
function getEmojiClassFromClassName(className?: string): string {
  if (!className) return 'text-xl';

  const sizeMap: Record<string, string> = {
    'size-3': 'text-[13px]',
    'size-3.5': 'text-sm',
    'size-4': 'text-base',
    'size-4.5': 'text-lg',
    'size-5': 'text-xl',
    'size-5.5': 'text-[1.375rem]', // to hơn một chút cho đẹp
    'size-6': 'text-2xl',
    'size-7': 'text-3xl',
    'size-8': 'text-4xl',
    'size-10': 'text-5xl',
    'size-12': 'text-6xl',
    'size-16': 'text-7xl',
    'size-20': 'text-8xl',
    'size-24': 'text-8xl',
    'size-28': 'text-8xl',
  };

  let mappedClass = className;
  let found = false;

  for (const [key, val] of Object.entries(sizeMap)) {
    if (className.includes(key)) {
      mappedClass = className
        .split(' ')
        .filter((c) => !c.startsWith('size-') && !c.startsWith('w-') && !c.startsWith('h-'))
        .join(' ') + ' ' + val;
      found = true;
      break;
    }
  }

  if (!found) {
    mappedClass = className
      .split(' ')
      .filter((c) => !c.startsWith('size-') && !c.startsWith('w-') && !c.startsWith('h-'))
      .join(' ') + ' text-xl';
  }

  return mappedClass;
}

/**
 * Hiển thị icon danh mục: ưu tiên Emoji, fallback sang Lucide icon.
 * Nếu chuỗi `name` là emoji → render <span> với ký tự emoji.
 * Nếu chuỗi `name` là tên Lucide hợp lệ → render component Lucide SVG.
 * Nếu cả hai đều không khớp → không render gì.
 */
export default function IconPreview({ name, className }: Props) {
  if (!name) return null;

  // Ưu tiên emoji: kiểm tra xem chuỗi có chứa emoji không
  if (isEmojiString(name)) {
    const emojiClassName = getEmojiClassFromClassName(className);
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center leading-none shrink-0 select-none font-normal translate-y-[-1px]', 
          emojiClassName
        )}
        role="img"
        aria-hidden="true"
      >
        {name}
      </span>
    );
  }

  // Fallback: thử render như Lucide icon (backward compatible cho dữ liệu cũ)
  const Cmp = getLucideIconComponent(name);
  if (!Cmp) return null;
  return createElement(Cmp, {
    className: cn('size-4 shrink-0', className),
    'aria-hidden': true,
  });
}
