import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PrivatePageShellProps = {
  title: string;
  description?: string;
  icon: LucideIcon;
  headerActions?: ReactNode;
  children?: ReactNode;
  /** Ví dụ `max-w-3xl` để thay thế mặc định `max-w-6xl` */
  contentClassName?: string;
};

/**
 * Khung trang private: vệt sáng + accent dùng token `primary` (đồng bộ với màu đã chọn trong Cài đặt).
 */
export function PrivatePageShell({
  title,
  description,
  icon: Icon,
  headerActions,
  children,
  contentClassName,
}: PrivatePageShellProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-44 bg-linear-to-b from-primary/12 via-primary/5 to-transparent blur-2xl" />

      <div
        className={cn(
          'relative mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-8',
          contentClassName,
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl border bg-card shadow-sm">
                <Icon className="size-3.5 sm:size-4 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
                {description ? (
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>
          </div>
          {headerActions ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{headerActions}</div>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}
