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
  SparklesIcon 
} from 'lucide-react';

import CreateCategoryDialog from '@/app/(private)/categories/components/create-category-dialog';
import CategoriesList from './components/categories-list';
import { useCategoriesPage } from './hooks/use-categories-page';

export default function CategoriesPage() {
  const {
    fetchCategories,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    createOpen,
    setCreateOpen,
    editingCategory,
    setEditingCategory,
    filtered,
    isLoading, // Nhận trạng thái tải dữ liệu từ hook
  } = useCategoriesPage();

  return (
    <>
      <PrivatePageShell
        title="Danh mục"
        description="Quản lý danh mục chi tiêu & thu nhập — thiết lập màu sắc & biểu tượng trực quan."
        icon={SparklesIcon}
        headerActions={
          <Button type="button" className="rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm danh mục
          </Button>
        }
      >
        {/* Bộ tìm kiếm & Lọc nhanh */}
        <div className="mt-5 rounded-2xl border bg-card/60 p-3 shadow-xs backdrop-blur-md supports-backdrop-filter:bg-card/45 sm:p-4 transition-all">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
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

            <div className="flex flex-wrap items-center gap-3">
              {/* Phân loại nhanh bằng dạng Tab (Segmented Control) */}
              <div className="flex items-center gap-1 rounded-xl border bg-muted/40 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer',
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
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer',
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
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer',
                    typeFilter === 'income'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs'
                      : 'text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5',
                  )}
                >
                  <ArrowUpRightIcon className="size-3.5" />
                  <span>Thu nhập</span>
                </button>
              </div>

              <Badge variant="outline" className="rounded-xl px-3 py-2 text-xs font-semibold bg-muted/30 border-muted-foreground/15 text-muted-foreground">
                {isLoading ? '...' : filtered.length} danh mục
              </Badge>
            </div>
          </div>
        </div>

        {/* Danh sách danh mục */}
        <div className="mt-5">
          <CategoriesList
            categories={filtered}
            isLoading={isLoading}
            onClearSearch={() => setQuery('')}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestEdit={(category) => setEditingCategory(category)}
          />
        </div>
      </PrivatePageShell>

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
                color: editingCategory.color || '',
              }
            : undefined
        }
        onSuccess={() => {
          fetchCategories();
          setCreateOpen(false);
          setEditingCategory(null);
        }}
      />
    </>
  );
}

