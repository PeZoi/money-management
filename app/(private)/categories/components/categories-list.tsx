'use client';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PencilIcon, PlusIcon, SparklesIcon } from 'lucide-react';

import { CategoryUi } from '@/types/category';
import { categoryCardAccentStyle, typeBadgeClass, typeLabel } from '../category-ui';

type CategoriesListProps = {
  categories: CategoryUi[];
  isLoading?: boolean;
  onClearSearch: () => void;
  onRequestCreate: () => void;
  onRequestEdit: (category: CategoryUi) => void;
};

// Helper chuyển mã màu Hex sang RGB để làm bóng mờ bằng Tailwind CSS
function hexToRgb(hex: string) {
  const raw = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#64748b';
  const r = parseInt(raw.slice(1, 3), 16);
  const g = parseInt(raw.slice(3, 5), 16);
  const b = parseInt(raw.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function CategoriesList({
  categories,
  isLoading,
  onClearSearch,
  onRequestCreate,
  onRequestEdit,
}: CategoriesListProps) {
  // Trạng thái Loading: Hiển thị 8 thẻ Skeleton giả lập cấu trúc
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl border border-muted bg-card/50 p-4 flex items-start gap-3 shadow-xs"
          >
            {/* Lớp phủ gradient giả lập */}
            <div className="absolute inset-0 bg-linear-to-br from-muted/5 to-transparent pointer-events-none" />

            {/* Giả lập Icon */}
            <Skeleton className="size-11 shrink-0 rounded-2xl" />

            {/* Giả lập thông tin chữ */}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4.5 w-2/3 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-5.5 w-14 rounded-xl shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Trạng thái không có dữ liệu phù hợp
  if (!categories.length) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-xs">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-muted/30">
          <SparklesIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có danh mục phù hợp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thử đổi bộ lọc hoặc tìm bằng tên icon (ví dụ: <span className="font-mono">Wallet</span>,{' '}
          <span className="font-mono">Home</span>).
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="rounded-xl cursor-pointer" onClick={onClearSearch}>
            Xóa tìm kiếm
          </Button>
          <Button type="button" className="rounded-xl cursor-pointer" onClick={onRequestCreate}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm danh mục
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((c) => {
        const catColor = c.color || '#64748b';
        const colorRgb = hexToRgb(catColor);

        return (
          <div
            key={c.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-300 cursor-pointer',
              'hover:-translate-y-0.5 hover:border-(--category-color)/40',
              'hover:shadow-[0_12px_24px_-8px_rgba(var(--category-color-rgb),0.18)]',
            )}
            style={
              {
                '--category-color': catColor,
                '--category-color-rgb': colorRgb,
                ...categoryCardAccentStyle(catColor),
              } as React.CSSProperties
            }
            onClick={() => onRequestEdit(c)}
          >
            {/* Gradient nền theo mã màu danh mục */}
            <div
              className={cn(
                'pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-100',
              )}
            />

            <div className="relative flex items-start gap-3 p-4">
              {/* Icon Container */}
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-input/60 bg-background/80 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:bg-background group-hover:border-(--category-color)/30">
                <IconPreview
                  name={c.icon}
                  className="size-5 text-(--category-color) transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold tracking-tight text-foreground/95 transition-colors group-hover:text-foreground">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground font-medium">
                      Icon: <span className="font-mono text-muted-foreground/80">{c.icon}</span>
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'shrink-0 rounded-xl border font-semibold px-2 py-0.5 text-[10px] transition-all',
                      typeBadgeClass(c.type),
                    )}
                  >
                    {typeLabel(c.type)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Nút chỉ báo hành động chỉnh sửa nhỏ ở góc phải dưới khi hover */}
            <div className="absolute right-3.5 bottom-3.5 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none">
              <div className="rounded-lg p-1.5 bg-muted/60 text-muted-foreground/80 border border-muted/80 backdrop-blur-xs">
                <PencilIcon className="size-3.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
