'use client';

import IconPickerDialog from '@/components/icons/icon-picker-dialog';
import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2Icon, SearchIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

import { DEFAULT_CATEGORY_COLOR, isValidHex6, useCategoryForm } from '@/hooks/use-categories';
import { CategoryType } from '@/types/category';
import { categoryCardAccentStyle, typeBadgeClass, typeLabel } from '../category-ui';

function normalizeHexInput(raw: string): string {
  let s = raw.trim().replace(/[^#0-9a-fA-F]/g, '');
  if (!s.startsWith('#')) s = `#${s}`;
  if (s.length > 7) s = s.slice(0, 7);
  return s;
}

type CreateCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  initialData?: {
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  };
  workspaceId?: string; // Required for creating new categories
  onSuccess?: () => void;
};

export default function CreateCategoryDialog({
  open,
  onOpenChange,
  categoryId,
  initialData,
  workspaceId,
  onSuccess,
}: CreateCategoryDialogProps) {
  const {
    draftName,
    setDraftName,
    draftType,
    setDraftType,
    draftIcon,
    setDraftIcon,
    draftColor,
    setDraftColor,
    isSubmitting,
    isUpdate,
    handleSubmit,
  } = useCategoryForm({
    open,
    onOpenChange,
    categoryId,
    initialData,
    workspaceId,
    onSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>{isUpdate ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</DialogTitle>
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
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Loại</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDraftType('expense')}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  draftType === 'expense'
                    ? 'border-rose-500/50 bg-rose-500/10 shadow-sm ring-2 ring-rose-500/25 dark:bg-rose-500/15'
                    : 'border-border bg-card hover:bg-muted/50',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                    draftType === 'expense'
                      ? 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  <TrendingDownIcon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className={cn('font-semibold', draftType === 'expense' && 'text-rose-700 dark:text-rose-300')}>
                    Chi tiêu
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">Tiền ra, chi phí hằng ngày</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDraftType('income')}
                disabled={isSubmitting}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  draftType === 'income'
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/25 dark:bg-emerald-500/15'
                    : 'border-border bg-card hover:bg-muted/50',
                  isSubmitting && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                    draftType === 'income'
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-border bg-muted/40 text-muted-foreground',
                  )}
                >
                  <TrendingUpIcon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn('font-semibold', draftType === 'income' && 'text-emerald-700 dark:text-emerald-300')}
                  >
                    Thu nhập
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">Tiền vào, nguồn thu</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-5">
            <div className="grid gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="category-color">Màu nền thẻ danh mục</Label>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="category-color"
                    aria-label="Chọn màu nền thẻ danh mục"
                    type="color"
                    value={isValidHex6(draftColor) ? draftColor : DEFAULT_CATEGORY_COLOR}
                    onChange={(e) => setDraftColor(e.target.value)}
                    disabled={isSubmitting}
                    className="h-11 w-16 shrink-0 cursor-pointer rounded-xl border border-input bg-background p-1 shadow-xs disabled:opacity-50"
                  />
                  <Input
                    value={draftColor}
                    onChange={(e) => setDraftColor(normalizeHexInput(e.target.value))}
                    placeholder="#64748b"
                    spellCheck={false}
                    disabled={isSubmitting}
                    className="h-11 max-w-44 rounded-xl font-mono text-sm"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5 flex-1">
              <Separator orientation="vertical" className="h-full" />
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <IconPickerDialog
                    value={draftIcon}
                    onChange={setDraftIcon}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Xem trước thẻ</p>
            <div className="relative max-w-sm overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div
                className="pointer-events-none absolute inset-0"
                style={categoryCardAccentStyle(isValidHex6(draftColor) ? draftColor : undefined)}
                aria-hidden
              />
              <div className="relative flex items-center gap-3 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background/80 shadow-sm">
                  <IconPreview name={draftIcon} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{draftName.trim() || 'Tên danh mục'}</span>
                    <Badge className={cn('shrink-0 rounded-xl border text-xs', typeBadgeClass(draftType))}>
                      {typeLabel(draftType)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                onClick={handleSubmit}
                disabled={isSubmitting || !draftName.trim()}
              >
                {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {isUpdate ? 'Lưu thay đổi' : 'Tạo danh mục'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
