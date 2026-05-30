'use client';

import { PrivatePageShell } from '@/components/private-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';

import CreateCategoryDialog from '@/app/(private)/categories/components/create-category-dialog';
import ApplyDefaultCategoriesDialog from '@/app/(private)/categories/components/apply-default-dialog';
import { useDraggable } from '@/hooks/use-draggable';
import CategoriesList from './components/categories-list';
import { useCategoriesPage } from './hooks/use-categories-page';

export default function CategoriesPage() {
  const {
    categories,
    fetchCategories,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    createOpen,
    setCreateOpen,
    editingCategory,
    setEditingCategory,
    applyDefaultsOpen,
    setApplyDefaultsOpen,
    filtered,
    isLoading, // Nhận trạng thái tải dữ liệu từ hook
    deletingId,
    handleDelete,
    handleApplyDefaults,
  } = useCategoriesPage();

  // Hook kéo thả FAB mượt mà trên di động
  const { ref: fabRef, dragInfo, handleDragStart } = useDraggable();

  return (
    <>
      <PrivatePageShell
        title="Danh mục"
        description="Quản lý danh mục chi tiêu & thu nhập — thiết lập màu sắc & biểu tượng trực quan."
        icon={SparklesIcon}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-xl border transition-all duration-300 text-xs sm:text-sm px-3.5 sm:px-4 h-9 sm:h-10 cursor-pointer active:scale-95 flex items-center gap-1.5 font-bold shadow-xs",
                "bg-linear-to-r from-amber-500/10 via-primary/5 to-primary/10",
                "border-amber-500/25 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300",
                "hover:shadow-md hover:shadow-amber-500/5 hover:border-amber-500/50 hover:scale-[1.02]",
              )}
              onClick={handleApplyDefaults}
              disabled={isLoading}
            >
              <SparklesIcon className="size-3.5 sm:size-4 text-amber-500 fill-amber-500/20" />
              <span>Áp dụng mẫu</span>
            </Button>
            <Button
              type="button"
              className="hidden md:inline-flex rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all cursor-pointer"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="mr-2 size-4" aria-hidden />
              Thêm danh mục
            </Button>
          </div>
        }
      >
        {/* Bộ tìm kiếm & Lọc nhanh */}
        <div className="mt-5 rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/45 sm:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Thanh tìm kiếm */}
            <div className="relative w-full md:max-w-md">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-40 transition-opacity group-focus-within:opacity-70"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên danh mục hoặc icon…"
                className="h-11 rounded-xl pl-9 bg-background/50 border-input/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
              />
            </div>

            {/* Bộ lọc và Số lượng thống kê */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end flex-1 w-full">
              {/* Phân loại nhanh bằng dạng Tab (Segmented Control) - Dàn đều 100% trên mobile */}
              <div className="flex w-full sm:w-auto p-1 rounded-xl bg-muted/50 border border-muted-foreground/10 gap-0.5 shadow-inner text-sm">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                    typeFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/20',
                  )}
                >
                  <LayersIcon className="size-3.5" />
                  <span>Tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('expense')}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                    typeFilter === 'expense'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs'
                      : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5',
                  )}
                >
                  <ArrowDownRightIcon className="size-3.5" />
                  <span>Chi tiêu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('income')}
                  className={cn(
                    'flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95',
                    typeFilter === 'income'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'
                      : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5',
                  )}
                >
                  <ArrowUpRightIcon className="size-3.5" />
                  <span>Thu nhập</span>
                </button>
              </div>

              {/* Thống kê số lượng danh mục */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto px-1">
                <span className="text-xs text-muted-foreground sm:hidden">Số lượng danh mục</span>
                <Badge variant="outline" className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-muted/30 border-muted-foreground/15 text-muted-foreground select-none shrink-0">
                  {isLoading ? '...' : filtered.length} danh mục
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách danh mục */}
        <div className="mt-5">
          <CategoriesList
            categories={filtered}
            isLoading={isLoading}
            isApplyingDefaults={applyDefaultsOpen}
            deletingId={deletingId}
            onClearSearch={() => setQuery('')}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestEdit={(category) => setEditingCategory(category)}
            onRequestDelete={handleDelete}
            onApplyDefaults={handleApplyDefaults}
          />
        </div>
      </PrivatePageShell>

      {/* Floating Action Button (FAB) trên di động - Có thể kéo thả (Draggable) */}
      <button
        ref={fabRef}
        type="button"
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleDragStart(touch.clientX, touch.clientY);
        }}
        onClick={(e) => {
          // Chỉ mở dialog nếu người dùng click thực sự, không phải thả ra sau khi kéo
          if (dragInfo.current.hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setCreateOpen(true);
        }}
        className="fixed bottom-24 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 md:hidden border border-primary/10 hover:bg-primary/95 touch-none select-none transition-transform active:scale-95"
        aria-label="Thêm danh mục"
      >
        <PlusIcon className="size-6 pointer-events-none" />
      </button>

      <CreateCategoryDialog
        open={createOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingCategory(null);
          } else {
            if (!editingCategory) setCreateOpen(true);
          }
        }}
        categoryId={editingCategory?.id}
        initialData={
          editingCategory
            ? {
                name: editingCategory.name,
                type: editingCategory.type,
                icon: editingCategory.icon,
              }
            : undefined
        }
        onSuccess={() => {
          fetchCategories();
          setCreateOpen(false);
          setEditingCategory(null);
        }}
      />

      <ApplyDefaultCategoriesDialog
        open={applyDefaultsOpen}
        onOpenChange={setApplyDefaultsOpen}
        existingCategories={categories}
        isLoading={isLoading}
        onSuccess={fetchCategories}
      />
    </>
  );
}

