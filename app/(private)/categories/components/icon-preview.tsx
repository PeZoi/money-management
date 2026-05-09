'use client';

import { createElement } from 'react';

import { getLucideIconComponent } from '@/components/icons/icon-picker';
import { cn } from '@/lib/utils';

type Props = {
  /** Tên export Lucide, ví dụ `Wallet`, `Home`. */
  name?: string | null;
  className?: string;
};

/** Hiển thị một icon Lucide theo tên chuỗi; không hợp lệ thì không render gì. */
export default function IconPreview({ name, className }: Props) {
  const Cmp = getLucideIconComponent(name ?? undefined);
  if (!Cmp) return null;
  return createElement(Cmp, {
    className: cn('size-4 shrink-0', className),
    'aria-hidden': true,
  });
}
