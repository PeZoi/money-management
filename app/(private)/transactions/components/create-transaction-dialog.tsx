'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/use-categories';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/types/database';
import {
  Loader2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function CreateTransactionDialog({ open, onOpenChange, onSuccess }: Props) {
  const { categories } = useCategories();
  const { isSubmitting, createTransaction } = useTransactionMutation();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);

  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategoryId('');
    setNote('');
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) return;

    const ok = await createTransaction(
      {
        amount: numAmount,
        type,
        category_id: categoryId || null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose(false);
        },
      }
    );
    if (!ok) return;
  };

  const isValid = Number(amount.replace(/[^0-9]/g, '')) > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>Thêm giao dịch mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* Type selector */}
          <div className="grid gap-2">
            <Label>Loại giao dịch</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as TransactionType[]).map((t) => {
                const isSelected = type === t;
                const isInc = t === 'income';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setCategoryId(''); }}
                    disabled={isSubmitting}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected && isInc && 'border-emerald-500/50 bg-emerald-500/10 ring-2 ring-emerald-500/25',
                      isSelected && !isInc && 'border-rose-500/50 bg-rose-500/10 ring-2 ring-rose-500/25',
                      !isSelected && 'border-border bg-card hover:bg-muted/50',
                      isSubmitting && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                        isSelected && isInc && 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                        isSelected && !isInc && 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400',
                        !isSelected && 'border-border bg-muted/40 text-muted-foreground',
                      )}
                    >
                      {isInc
                        ? <TrendingUpIcon className="size-5" aria-hidden />
                        : <TrendingDownIcon className="size-5" aria-hidden />}
                    </span>
                    <div>
                      <p className={cn('font-semibold', isSelected && isInc && 'text-emerald-700 dark:text-emerald-300', isSelected && !isInc && 'text-rose-700 dark:text-rose-300')}>
                        {isInc ? 'Thu nhập' : 'Chi tiêu'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isInc ? 'Tiền vào, nguồn thu' : 'Tiền ra, chi phí'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="tx-amount">Số tiền (VND)</Label>
            <Input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="h-12 rounded-xl text-lg font-semibold"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          {filteredCategories.length > 0 && (
            <div className="grid gap-2">
              <Label>Danh mục (tuỳ chọn)</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  disabled={isSubmitting}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-sm font-medium transition-all',
                    !categoryId
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
                  )}
                >
                  Không chọn
                </button>
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    disabled={isSubmitting}
                    className={cn(
                      'rounded-xl border px-3 py-1.5 text-sm font-medium transition-all',
                      categoryId === c.id
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-muted/50',
                    )}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div className="grid gap-2">
            <Label htmlFor="tx-note">Ghi chú (tuỳ chọn)</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ăn trưa với bạn bè…"
              className="h-11 rounded-xl"
              disabled={isSubmitting}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="button" className="rounded-xl" onClick={handleSubmit} disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Thêm giao dịch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
