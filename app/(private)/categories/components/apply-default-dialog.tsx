/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SparklesIcon, Loader2Icon, CheckCircle2Icon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import IconPreview from '@/components/icons/icon-preview';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '@/lib/constants/default-categories';
import { CategoryUi } from '@/types/category';

type ApplyDefaultCategoriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCategories: CategoryUi[];
  isLoading?: boolean;
  onSuccess?: () => void;
};

export default function ApplyDefaultCategoriesDialog({
  open,
  onOpenChange,
  existingCategories,
  isLoading = false,
  onSuccess,
}: ApplyDefaultCategoriesDialogProps) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Lọc ra các danh mục mẫu chưa tồn tại trong workspace hiện tại
  const availableExpense = React.useMemo(() => {
    return DEFAULT_EXPENSE_CATEGORIES.filter((def) => {
      return !existingCategories.some(
        (c) => c.name.toLowerCase().trim() === def.name.toLowerCase().trim() && c.type === 'expense'
      );
    });
  }, [existingCategories]);

  const availableIncome = React.useMemo(() => {
    return DEFAULT_INCOME_CATEGORIES.filter((def) => {
      return !existingCategories.some(
        (c) => c.name.toLowerCase().trim() === def.name.toLowerCase().trim() && c.type === 'income'
      );
    });
  }, [existingCategories]);

  // Danh sách các danh mục được chọn (mặc định chọn hết)
  const [selectedExpense, setSelectedExpense] = React.useState<string[]>([]);
  const [selectedIncome, setSelectedIncome] = React.useState<string[]>([]);

  // Reset selection mỗi khi dialog mở ra
  React.useEffect(() => {
    if (open) {
      setSelectedExpense(availableExpense.map((c) => c.name));
      setSelectedIncome(availableIncome.map((c) => c.name));
    }
  }, [open, availableExpense, availableIncome]);

  const handleToggleExpense = (name: string) => {
    setSelectedExpense((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleToggleIncome = (name: string) => {
    setSelectedIncome((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedExpense(availableExpense.map((c) => c.name));
    setSelectedIncome(availableIncome.map((c) => c.name));
  };

  const handleDeselectAll = () => {
    setSelectedExpense([]);
    setSelectedIncome([]);
  };

  const handleSave = async () => {
    if (!activeWorkspaceId) {
      toast.error('Không tìm thấy workspace hoạt động');
      return;
    }

    const expenseToCreate = availableExpense.filter((c) => selectedExpense.includes(c.name));
    const incomeToCreate = availableIncome.filter((c) => selectedIncome.includes(c.name));
    const totalToCreate = [...expenseToCreate, ...incomeToCreate];

    if (totalToCreate.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một danh mục để thêm');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = totalToCreate.map((c) => ({
        workspace_id: activeWorkspaceId,
        name: c.name,
        icon: c.icon,
        type: c.type,
      }));

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Lỗi thêm danh mục');
      }

      toast.success(`Đã thêm thành công ${totalToCreate.length} danh mục mặc định!`);
      
      // Invalidate cache
      queryClient.invalidateQueries({
        queryKey: ['categories', activeWorkspaceId],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAvailable = availableExpense.length + availableIncome.length;
  const totalSelected = selectedExpense.length + selectedIncome.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullScreenOnMobile className="sm:max-w-2xl sm:max-h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col gap-0 p-0 border border-border/60">
        {/* Header với hiệu ứng gradient đẹp mắt */}
        <div className="relative p-6 pb-4 border-b border-border bg-linear-to-r from-primary/5 via-transparent to-transparent shrink-0">
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-20 bg-linear-to-b from-primary/5 to-transparent blur-xl" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="inline-flex size-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
                <SparklesIcon className="size-4.5 fill-amber-500/10" />
              </span>
              Áp dụng danh mục mẫu
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Chọn các danh mục mẫu bạn muốn thêm vào workspace hiện tại. Các danh mục đã có sẽ được tự động ẩn đi để tránh trùng lặp.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Nội dung Form cuộn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2Icon className="size-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Đang tải danh sách danh mục...</p>
            </div>
          ) : totalAvailable === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
                <CheckCircle2Icon className="size-6" />
              </div>
              <h4 className="text-sm font-semibold">Tất cả danh mục mặc định đã có sẵn!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Workspace của bạn đã sở hữu đầy đủ bộ danh mục mẫu từ hệ thống. Bạn không cần thêm gì nữa.
              </p>
            </div>
          ) : (
            <>
              {/* Lựa chọn nhanh */}
              <div className="flex items-center justify-between text-xs shrink-0 bg-muted/30 border border-border/40 rounded-xl p-3">
                <span className="text-muted-foreground font-medium">
                  Đang chọn: <strong className="text-foreground">{totalSelected}</strong> / {totalAvailable} danh mục
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-primary hover:underline font-semibold cursor-pointer active:scale-95 transition-transform"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-muted-foreground/30">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-muted-foreground hover:text-foreground font-semibold cursor-pointer active:scale-95 transition-transform"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Chi tiêu */}
              {availableExpense.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[11px] font-bold text-rose-500 block uppercase tracking-wider">
                    Mẫu Chi tiêu ({availableExpense.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableExpense.map((c) => {
                      const isSelected = selectedExpense.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleToggleExpense(c.name)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left border transition-all duration-200 select-none cursor-pointer text-xs font-semibold focus:outline-hidden",
                            isSelected
                              ? "bg-rose-500/5 border-rose-500/30 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/10 shadow-xs"
                              : "bg-background border-border/80 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <span className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                            isSelected 
                              ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                              : "border-border bg-muted/40 text-muted-foreground"
                          )}>
                            <IconPreview name={c.icon} className="size-3.5" />
                          </span>
                          <span className="truncate flex-1">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Thu nhập */}
              {availableIncome.length > 0 && (
                <div className="space-y-3 pt-2">
                  <Label className="text-[11px] font-bold text-emerald-500 block uppercase tracking-wider">
                    Mẫu Thu nhập ({availableIncome.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableIncome.map((c) => {
                      const isSelected = selectedIncome.includes(c.name);
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleToggleIncome(c.name)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left border transition-all duration-200 select-none cursor-pointer text-xs font-semibold focus:outline-hidden",
                            isSelected
                              ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/10 shadow-xs"
                              : "bg-background border-border/80 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <span className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
                            isSelected 
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                              : "border-border bg-muted/40 text-muted-foreground"
                          )}>
                            <IconPreview name={c.icon} className="size-3.5" />
                          </span>
                          <span className="truncate flex-1">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/10 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs rounded-xl w-full sm:w-auto h-10"
            type="button"
          >
            Đóng
          </Button>
          {totalAvailable > 0 && (
            <Button
              onClick={handleSave}
              disabled={isSubmitting || totalSelected === 0 || isLoading}
              className="rounded-xl text-xs font-semibold px-5 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 w-full sm:w-auto h-10 cursor-pointer"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                `Áp dụng ${totalSelected} danh mục`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
