'use client';

import { m } from 'framer-motion';
import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2Icon, PlusIcon, SparklesIcon, Trash2Icon } from 'lucide-react';

import { CategoryUi } from '@/types/category';
import { typeBadgeClass, typeLabel } from '../category-ui';
import { staggerContainer, fadeSlideUp } from '@/lib/motion-variants';

type CategoriesListProps = {
  categories: CategoryUi[];
  isLoading?: boolean;
  isApplyingDefaults?: boolean;
  deletingId?: string | null;
  onClearSearch: () => void;
  onRequestCreate: () => void;
  onRequestEdit: (category: CategoryUi) => void;
  onRequestDelete: (id: string) => void;
  onApplyDefaults?: () => void;
};



import { useEffect, useRef } from 'react';

// Component danh mục hỗ trợ vuốt kéo sang trái (Swipe Left to Delete)
function CategoryCard({
  c,
  isDeleting,
  onRequestEdit,
  onRequestDelete,
}: {
  c: CategoryUi;
  isDeleting?: boolean;
  onRequestEdit: (category: CategoryUi) => void;
  onRequestDelete: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const currentX = useRef(0);
  const isOpen = useRef(false);
  const isDragging = useRef(false);

  // Bắt đầu chạm
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = true;

    // Tắt transition để di chuyển phản hồi ngay lập tức
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
    if (deleteBtnRef.current) {
      deleteBtnRef.current.style.transition = 'none';
      deleteBtnRef.current.style.visibility = 'visible';
    }
  };

  // Kéo di chuyển
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStart.current.x;
    const diffY = touch.clientY - touchStart.current.y;

    // Bỏ qua nếu cuộn dọc nhiều hơn kéo ngang
    if (Math.abs(diffY) > Math.abs(diffX)) return;

    // Kéo sang trái: targetX âm
    let targetX = isOpen.current ? diffX - 80 : diffX;

    // Tạo hiệu ứng đàn hồi khi kéo quá -80px
    if (targetX < -80) {
      targetX = -80 + (targetX + 80) * 0.35;
    }
    // Giới hạn kéo dương (sang phải) để tránh lệch
    if (targetX > 0) {
      targetX = targetX * 0.25;
    }

    currentX.current = targetX;
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${targetX}px, 0, 0)`;
    }

    // Điều chỉnh độ mờ (opacity) của nút xóa tỉ lệ với khoảng cách kéo
    if (deleteBtnRef.current) {
      const opacity = Math.min(1, Math.abs(targetX) / 80);
      deleteBtnRef.current.style.opacity = String(opacity);
    }
  };

  // Thả tay ra
  const handleTouchEnd = () => {
    isDragging.current = false;
    
    // Thiết lập lại transition mượt mà
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
    }
    if (deleteBtnRef.current) {
      deleteBtnRef.current.style.transition = 'opacity 0.25s ease, visibility 0.25s ease';
    }

    if (cardRef.current) {
      // Nếu kéo sang trái hơn 40px thì mở nút xóa bên phải hoàn toàn ở vị trí -80px
      if (currentX.current < -40) {
        cardRef.current.style.transform = 'translate3d(-80px, 0, 0)';
        isOpen.current = true;
        currentX.current = -80;
        if (deleteBtnRef.current) {
          deleteBtnRef.current.style.opacity = '1';
          deleteBtnRef.current.style.visibility = 'visible';
        }
      } else {
        cardRef.current.style.transform = 'translate3d(0px, 0, 0)';
        isOpen.current = false;
        currentX.current = 0;
        if (deleteBtnRef.current) {
          deleteBtnRef.current.style.opacity = '0';
          deleteBtnRef.current.style.visibility = 'hidden';
        }
      }
    }
  };

  // Tự động đóng lại khi nhấp bên ngoài
  useEffect(() => {
    const handleGlobalClick = () => {
      if (isOpen.current) {
        if (cardRef.current) {
          cardRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
          cardRef.current.style.transform = 'translate3d(0px, 0, 0)';
        }
        if (deleteBtnRef.current) {
          deleteBtnRef.current.style.transition = 'opacity 0.2s ease, visibility 0.2s ease';
          deleteBtnRef.current.style.opacity = '0';
          deleteBtnRef.current.style.visibility = 'hidden';
        }
        isOpen.current = false;
        currentX.current = 0;
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <m.div
      variants={fadeSlideUp}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/50 bg-gray-200 dark:bg-muted/20 shadow-xs transition-all duration-300",
        c.type === 'income' 
          ? "hover:border-emerald-500/35 hover:shadow-[0_12px_24px_-8px_rgba(16,185,129,0.15)]" 
          : "hover:border-rose-500/35 hover:shadow-[0_12px_24px_-8px_rgba(244,63,94,0.15)]"
      )}
    >
      {/* Nút Xóa sang trọng nằm chìm bên dưới phía bên phải (Chỉ hiển thị trên mobile, mặc định ẩn bằng opacity-0 để tránh lộ viền) */}
      <button
        ref={deleteBtnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete(c.id);
        }}
        className="absolute right-0 top-0 bottom-0 z-0 flex w-20 items-center justify-center bg-linear-to-l from-rose-600 to-rose-500 rounded-r-2xl text-white font-semibold shadow-inner active:opacity-90 md:hidden opacity-0 invisible transition-all duration-200 border border-transparent"
      >
        <div className="flex flex-col items-center gap-1.5 transition-transform duration-200 active:scale-95">
          <Trash2Icon className="size-5" />
          <span className="text-[10px] font-semibold tracking-wide">Xóa</span>
        </div>
      </button>

      {/* Panel nội dung chính nằm phía trên */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (isOpen.current) {
            e.stopPropagation();
            cardRef.current!.style.transition = 'transform 0.2s ease';
            cardRef.current!.style.transform = 'translate3d(0px, 0, 0)';
            if (deleteBtnRef.current) {
              deleteBtnRef.current.style.transition = 'opacity 0.2s ease, visibility 0.2s ease';
              deleteBtnRef.current.style.opacity = '0';
              deleteBtnRef.current.style.visibility = 'hidden';
            }
            isOpen.current = false;
            currentX.current = 0;
            return;
          }
          onRequestEdit(c);
        }}
        className={cn(
          "relative z-10 flex h-full cursor-pointer items-start gap-3 bg-card p-4 transition-all duration-300 select-none w-full",
          isDeleting && "pointer-events-none opacity-50 bg-muted/20"
        )}
      >
        <div className="relative flex items-start gap-3 w-full">
          {/* Icon Container */}
          <div className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background/80 shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:bg-background",
            c.type === 'income' 
              ? "border-emerald-500/20 text-emerald-500 group-hover:border-emerald-500/40" 
              : "border-rose-500/20 text-rose-500 group-hover:border-rose-500/40"
          )}>
            {isDeleting ? (
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <IconPreview
                name={c.icon}
                className="size-5 transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold tracking-tight text-foreground/95 transition-colors group-hover:text-foreground">
                  {c.name}
                </h3>
                {c.updated_at && (
                  <p className="mt-1 text-[10px] text-muted-foreground/75 font-normal tracking-wide whitespace-nowrap">
                    Cập nhật: {format(new Date(c.updated_at), 'dd/MM/yyyy')}
                  </p>
                )}
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


      </div>
    </m.div>
  );
}

export default function CategoriesList({
  categories,
  isLoading,
  isApplyingDefaults,
  deletingId,
  onClearSearch,
  onRequestCreate,
  onRequestEdit,
  onRequestDelete,
  onApplyDefaults,
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
      <div className="rounded-2xl border bg-card p-10 text-center shadow-xs animate-in fade-in duration-300">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-muted/30">
          <SparklesIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có danh mục phù hợp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bạn chưa tạo danh mục nào hoặc không tìm thấy danh mục phù hợp. Hãy thêm mới hoặc áp dụng bộ mẫu mặc định có sẵn.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="rounded-xl cursor-pointer w-full sm:w-auto" onClick={onClearSearch}>
            Xóa tìm kiếm
          </Button>
          {onApplyDefaults && (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-xl cursor-pointer w-full sm:w-auto gap-1.5 active:scale-95 transition-all duration-300 font-bold shadow-xs",
                "bg-linear-to-r from-amber-500/10 via-primary/5 to-primary/10",
                "border-amber-500/30 text-amber-600 dark:text-amber-400 hover:border-amber-500/50 hover:bg-linear-to-r hover:from-amber-500/15 hover:to-primary/20 hover:scale-[1.02]"
              )}
              onClick={onApplyDefaults}
              disabled={isApplyingDefaults}
            >
              <SparklesIcon className="size-4 text-amber-500 fill-amber-500/20" />
              {isApplyingDefaults ? 'Đang tạo mẫu...' : 'Áp dụng mẫu mặc định'}
            </Button>
          )}
          <Button type="button" className="rounded-xl cursor-pointer w-full sm:w-auto" onClick={onRequestCreate}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm danh mục
          </Button>
        </div>
      </div>
    );
  }

  return (
    <m.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {categories.map((c) => (
        <CategoryCard
          key={c.id}
          c={c}
          isDeleting={deletingId === c.id}
          onRequestEdit={onRequestEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </m.div>
  );
}
