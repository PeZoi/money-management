'use client';

import { useMemo, useState } from 'react';

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
import {
  ChevronDownIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
} from 'lucide-react';

import CategoriesList from './components/categories-list';
import { CATEGORIES_MOCK, CategoryType, normalizeText, typeLabel } from './category-ui';
import CreateCategoryDialog from '@/app/(private)/categories/components/create-category-dialog';

export default function CategoriesPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return CATEGORIES_MOCK.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!q) return true;
      const hay = normalizeText(`${c.name} ${c.icon} ${typeLabel(c.type)}`);
      return hay.includes(q);
    });
  }, [query, typeFilter]);

  return (
    <>
      <PrivatePageShell
        title="Danh mục"
        description="Quản lý danh mục chi tiêu & thu nhập — icon rõ ràng, dễ nhận diện."
        icon={SparklesIcon}
        headerActions={
          <>
            <div className="flex items-center rounded-xl border bg-card p-1 shadow-sm">
              <Button
                type="button"
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-lg"
                onClick={() => setView('grid')}
              >
                <LayoutGridIcon className="mr-2 size-4" aria-hidden />
                Lưới
              </Button>
              <Button
                type="button"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-lg"
                onClick={() => setView('list')}
              >
                <ListIcon className="mr-2 size-4" aria-hidden />
                Danh sách
              </Button>
            </div>

            <Button type="button" className="rounded-xl" onClick={() => setCreateOpen(true)}>
              <PlusIcon className="mr-2 size-4" aria-hidden />
              Thêm danh mục
            </Button>
          </>
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
            view={view}
            onClearSearch={() => setQuery('')}
            onRequestCreate={() => setCreateOpen(true)}
          />
        </div>

        <div className="mt-8 rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl border bg-card">
                <SparklesIcon className="size-4 opacity-70" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="font-medium text-foreground">Mẹo thiết kế</div>
                <div className="truncate">Giữ tên ngắn gọn, icon nhất quán để nhìn là hiểu ngay.</div>
              </div>
            </div>

            <Button type="button" variant="outline" className="rounded-xl">
              <SparklesIcon className="mr-2 size-4" aria-hidden />
              Tối ưu icon
            </Button>
          </div>
        </div>
      </PrivatePageShell>

      <CreateCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
