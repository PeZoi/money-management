'use client';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlusIcon, SparklesIcon } from 'lucide-react';

import type { CategoryUi } from '../category-ui';
import { accentClass, categoryCardAccentStyle, typeBadgeClass, typeLabel } from '../category-ui';

type CategoriesListProps = {
  categories: CategoryUi[];
  view: 'grid' | 'list';
  onClearSearch: () => void;
  onRequestCreate: () => void;
};

export default function CategoriesList({ categories, view, onClearSearch, onRequestCreate }: CategoriesListProps) {
  if (!categories.length) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border bg-muted/30">
          <SparklesIcon className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có danh mục phù hợp</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thử đổi bộ lọc hoặc tìm bằng tên icon (ví dụ: <span className="font-mono">Wallet</span>,{' '}
          <span className="font-mono">Home</span>).
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClearSearch}>
            Xóa tìm kiếm
          </Button>
          <Button type="button" className="rounded-xl" onClick={onRequestCreate}>
            <PlusIcon className="mr-2 size-4" aria-hidden />
            Thêm danh mục
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className={cn(
              'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0',
                c.color ? '' : cn('bg-linear-to-br', accentClass(c.colorHint)),
              )}
              style={c.color ? categoryCardAccentStyle(c.color) : undefined}
            />
            <div className="relative flex items-start gap-3 p-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background/70 shadow-sm">
                <IconPreview name={c.icon} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold tracking-tight">{c.name}</h3>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Icon: <span className="font-mono">{c.icon}</span>
                    </p>
                  </div>
                  <Badge className={cn('shrink-0 rounded-xl border', typeBadgeClass(c.type))}>
                    {typeLabel(c.type)}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" className="rounded-xl">
                    Sửa
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl">
                    Xem
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-between border-t bg-background/50 px-4 py-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <SparklesIcon className="size-3.5 opacity-70" aria-hidden />
                Gợi ý
              </span>
              <span className="truncate">Kéo-thả để sắp xếp (UI mẫu)</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <div
          key={c.id}
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0',
              c.color ? '' : cn('bg-linear-to-br', accentClass(c.colorHint)),
            )}
            style={c.color ? categoryCardAccentStyle(c.color) : undefined}
            aria-hidden
          />
          <div className="relative flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/20">
              <IconPreview name={c.icon} className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate font-semibold">{c.name}</div>
                <Badge className={cn('rounded-xl border', typeBadgeClass(c.type))}>{typeLabel(c.type)}</Badge>
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-mono">{c.icon}</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2 sm:justify-end">
            <Button type="button" variant="secondary" size="sm" className="rounded-xl">
              Sửa
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-xl">
              Xem
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
