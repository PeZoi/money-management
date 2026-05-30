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
import { Loader2Icon, SearchIcon, TrendingDownIcon, TrendingUpIcon, Trash2Icon } from 'lucide-react';

import { useCategoryForm, useCategoryMutation } from '@/hooks/use-categories';
import { useConfirm } from '@/hooks/use-confirm';
import { CategoryType } from '@/types/category';
import { typeBadgeClass, typeLabel } from '../category-ui';

type CreateCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  initialData?: {
    name: string;
    type: CategoryType;
    icon: string;
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
  const { deleteCategory, isSubmitting: isDeleting } = useCategoryMutation();
  const confirm = useConfirm();

  const handleDeleteClick = async () => {
    if (!categoryId) return;
    const confirmed = await confirm({
      title: 'Xóa danh mục',
      message: 'Bạn có chắc chắn muốn xóa danh mục này? Các giao dịch liên kết với danh mục này sẽ chuyển sang danh mục mặc định.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteCategory(categoryId, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const isLoading = isSubmitting || isDeleting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>{isUpdate ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</DialogTitle>
        </DialogHeader>

        {/* Phần thân form chứa các trường nhập liệu có khả năng cuộn độc lập */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
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

          <div className="grid gap-2">
            <Label>Emoji danh mục</Label>
            <div className="flex flex-wrap items-center gap-2">
              <IconPickerDialog
                value={draftIcon}
                onChange={setDraftIcon}
                className="rounded-xl"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Xem trước thẻ</p>
            <div className={cn(
              "relative max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xs transition-colors duration-300",
              draftType === 'income' ? 'hover:border-emerald-500/30' : 'hover:border-rose-500/30'
            )}>
              <div className="relative flex items-center gap-3 p-3">
                <div className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  draftType === 'income' 
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' 
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                )}>
                  <IconPreview name={draftIcon} className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-sm">{draftName.trim() || 'Tên danh mục'}</span>
                    <Badge className={cn('shrink-0 rounded-xl border px-2 py-0.5 text-[10px] font-semibold', typeBadgeClass(draftType))}>
                      {typeLabel(draftType)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phần nút điều khiển (Footer) được cố định ở chân dialog */}
        <div className="border-t px-5 pt-4 pb-8 sm:py-4 sm:px-6 bg-muted/10 shrink-0 flex flex-row items-center justify-between gap-3">
          {isUpdate ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-semibold cursor-pointer active:scale-95 transition-all text-xs sm:text-sm px-3 gap-1.5 h-9 sm:h-10"
              onClick={handleDeleteClick}
              disabled={isLoading}
            >
              {isDeleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <Trash2Icon className="size-4" />
              )}
              {isDeleting ? 'Đang xóa...' : 'Xóa danh mục'}
            </Button>
          ) : (
            <div /> // Giữ chỗ cho justify-between hoạt động đúng khi tạo mới
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs sm:text-sm h-9 sm:h-10"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 cursor-pointer active:scale-95 transition-all font-semibold"
              onClick={handleSubmit}
              disabled={isLoading || !draftName.trim()}
            >
              {isLoading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {isUpdate ? 'Lưu thay đổi' : 'Tạo danh mục'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
