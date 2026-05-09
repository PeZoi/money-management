'use client';

import { useMemo, useState } from 'react';

import IconPickerDialog from '@/components/icons/icon-picker-dialog';
import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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

type CategoryType = 'expense' | 'income';

type CategoryUi = {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
  colorHint: 'emerald' | 'violet' | 'amber' | 'sky' | 'rose' | 'slate';
};

const CATEGORIES_MOCK: CategoryUi[] = [
  { id: 'c1', name: 'Ăn uống', icon: 'Utensils', type: 'expense', colorHint: 'amber' },
  { id: 'c2', name: 'Đi lại', icon: 'Car', type: 'expense', colorHint: 'sky' },
  { id: 'c3', name: 'Mua sắm', icon: 'ShoppingBag', type: 'expense', colorHint: 'violet' },
  { id: 'c4', name: 'Giải trí', icon: 'Popcorn', type: 'expense', colorHint: 'rose' },
  { id: 'c5', name: 'Sức khỏe', icon: 'HeartPulse', type: 'expense', colorHint: 'emerald' },
  { id: 'c6', name: 'Nhà ở', icon: 'Home', type: 'expense', colorHint: 'slate' },
  { id: 'c7', name: 'Lương', icon: 'Wallet', type: 'income', colorHint: 'emerald' },
  { id: 'c8', name: 'Thưởng', icon: 'Sparkles', type: 'income', colorHint: 'violet' },
];

function normalizeText(s: string) {
  try {
    return s
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

function typeLabel(t: CategoryType) {
  return t === 'income' ? 'Thu nhập' : 'Chi tiêu';
}

function typeBadgeClass(t: CategoryType) {
  return t === 'income'
    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300';
}

function accentClass(h: CategoryUi['colorHint']) {
  switch (h) {
    case 'emerald':
      return 'from-emerald-500/12 to-emerald-500/0';
    case 'violet':
      return 'from-violet-500/12 to-violet-500/0';
    case 'amber':
      return 'from-amber-500/14 to-amber-500/0';
    case 'sky':
      return 'from-sky-500/12 to-sky-500/0';
    case 'rose':
      return 'from-rose-500/12 to-rose-500/0';
    default:
      return 'from-slate-500/10 to-slate-500/0';
  }
}

export default function CategoriesPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // UI-only: form trong dialog (chưa lưu dữ liệu)
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState<CategoryType>('expense');
  const [draftIcon, setDraftIcon] = useState<string>('Tag');

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
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-44 bg-linear-to-b from-primary/12 via-primary/5 to-transparent blur-2xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-xl border bg-card shadow-sm">
                <SparklesIcon className="size-4 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">Danh mục</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Quản lý danh mục chi tiêu & thu nhập — icon rõ ràng, dễ nhận diện.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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

            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" className="rounded-xl">
                  <PlusIcon className="mr-2 size-4" aria-hidden />
                  Thêm danh mục
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl gap-0 p-0">
                <DialogHeader className="border-b px-5 py-4 sm:px-6">
                  <DialogTitle>Tạo danh mục mới</DialogTitle>
                </DialogHeader>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  <div className="grid gap-2">
                    <Label htmlFor="category-name">Tên danh mục</Label>
                    <div className="relative">
                      <SearchIcon
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50"
                        aria-hidden
                      />
                      <Input
                        id="category-name"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="Ví dụ: Ăn uống, Di chuyển, Lương…"
                        className="h-11 rounded-xl pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Loại</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={draftType === 'expense' ? 'secondary' : 'outline'}
                        className="rounded-xl"
                        onClick={() => setDraftType('expense')}
                      >
                        Chi tiêu
                      </Button>
                      <Button
                        type="button"
                        variant={draftType === 'income' ? 'secondary' : 'outline'}
                        className="rounded-xl"
                        onClick={() => setDraftType('income')}
                      >
                        Thu nhập
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <IconPickerDialog value={draftIcon} onChange={setDraftIcon} className="rounded-xl" />
                      <div className="flex items-center gap-2 rounded-xl border bg-muted/20 px-3 py-2 text-sm">
                        <span className="inline-flex size-8 items-center justify-center rounded-lg border bg-card">
                          <IconPreview name={draftIcon} className="size-[18px]" />
                        </span>
                        <span className="font-mono">{draftIcon}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Đây là giao diện mẫu (UI-only). Chức năng lưu sẽ nối sau.
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" className="rounded-xl">
                        Hủy
                      </Button>
                      <Button type="button" className="rounded-xl" disabled>
                        Tạo danh mục
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-card/60 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" aria-hidden />
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
                    <span className={cn('mr-2 inline-flex size-2 rounded-full bg-muted-foreground/40', typeFilter === 'all' && 'bg-primary')} />
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

              <Badge className="rounded-xl px-3 py-2 text-sm">
                {filtered.length} danh mục
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {!filtered.length ? (
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
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setQuery('')}>
                  Xóa tìm kiếm
                </Button>
                <Button type="button" className="rounded-xl">
                  <PlusIcon className="mr-2 size-4" aria-hidden />
                  Thêm danh mục
                </Button>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                  )}
                >
                  <div className={cn('pointer-events-none absolute inset-0 bg-linear-to-br', accentClass(c.colorHint))} />
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
                        <Badge className={cn('shrink-0 rounded-xl border', typeBadgeClass(c.type))}>{typeLabel(c.type)}</Badge>
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
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
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

                  <div className="flex items-center gap-2 sm:justify-end">
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
          )}
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
      </div>
    </div>
  );
}
