'use client';

import { PrivatePageShell } from '@/components/private-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, PlusIcon, SearchIcon, SlidersHorizontalIcon, SparklesIcon } from 'lucide-react';

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
  } = useCategoriesPage();

  return (
    <>
      <PrivatePageShell
        title="Danh mục"
        description="Quản lý danh mục chi tiêu & thu nhập — icon rõ ràng, dễ nhận diện."
        icon={SparklesIcon}
        headerActions={
          <Button type="button" className="rounded-xl" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm danh mục
          </Button>
        }
      >
        <div className="mt-5 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/60 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc icon…"
                className="h-11 rounded-xl pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="rounded-xl">
                    <SlidersHorizontalIcon className="mr-2 size-4" aria-hidden />
                    Bộ lọc
                    <ChevronDownIcon className="ml-2 size-4 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                    <span
                      className={cn(
                        'mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40',
                        typeFilter === 'all' && 'bg-primary',
                      )}
                    />
                    Tất cả
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('expense')}>
                    <span
                      className={cn(
                        'mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40',
                        typeFilter === 'expense' && 'bg-rose-500',
                      )}
                    />
                    Chi tiêu
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('income')}>
                    <span
                      className={cn(
                        'mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40',
                        typeFilter === 'income' && 'bg-emerald-500',
                      )}
                    />
                    Thu nhập
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge className="rounded-xl px-3 py-2 text-sm">{filtered.length} danh mục</Badge>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <CategoriesList
            categories={filtered}
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
