import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import IconPreview from '@/components/icons/icon-preview';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/use-categories';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { cn } from '@/lib/utils';
import type { TransactionType, TransactionWithCategory } from '@/types/database';
import {
  Calendar as CalendarIcon,
  HelpCircleIcon,
  Loader2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';

type Props = {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

// Định dạng số tiền sang dạng hiển thị có dấu phẩy (ví dụ: 100,000)
const formatAmountInput = (val: string) => {
  const clean = val.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('en-US');
};

export default function UpdateTransactionDialog({ transaction, open, onOpenChange, onSuccess }: Props) {
  const { categories } = useCategories();
  const { isSubmitting, updateTransaction } = useTransactionMutation();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState('');
  // Sử dụng Date đối tượng trực tiếp thay vì chuỗi
  const [date, setDate] = useState<Date>(() => new Date());

  // Cập nhật giá trị form khi transaction thay đổi hoặc modal được mở
  useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(formatAmountInput(transaction.amount.toString()));
      setType(transaction.type);
      setCategoryId(transaction.category_id || '');
      setNote(transaction.note || '');

      // Chuyển đổi created_at từ DB sang đối tượng Date
      if (transaction.created_at) {
        setDate(new Date(transaction.created_at));
      } else {
        setDate(new Date());
      }
    }
  }, [transaction, open]);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) return;

    // Tránh lệch múi giờ, đồng thời lấy chính xác giờ phút giây hiện tại thay vì mặc định 12:00:00
    const now = new Date();
    const formattedCreatedAt = date
      ? new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        ).toISOString()
      : null;

    const ok = await updateTransaction(
      transaction.id,
      {
        amount: numAmount,
        type,
        category_id: categoryId || null,
        note: note.trim() || null,
        created_at: formattedCreatedAt,
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
          <DialogTitle>Cập nhật giao dịch</DialogTitle>
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

          {/* Tên giao dịch (Lưu trữ ở cột note) */}
          <div className="grid gap-2">
            <Label htmlFor="tx-note">Tên giao dịch</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Ăn trưa, xăng xe, mua sắm…"
              className="h-11 rounded-xl"
              disabled={isSubmitting}
            />
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="tx-amount">Số tiền (VND)</Label>
            <Input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              placeholder="0"
              className="h-12 rounded-xl text-lg font-semibold"
              disabled={isSubmitting}
            />
          </div>

          {/* Category */}
          <div className="grid gap-2">
            <Label>Danh mục</Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {/* Option "Khác" (mặc định / không chọn) */}
              <button
                type="button"
                onClick={() => setCategoryId('')}
                disabled={isSubmitting}
                className={cn(
                  'group flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 aspect-square text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  !categoryId
                    ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
                  isSubmitting && 'cursor-not-allowed opacity-50',
                )}
              >
                <span className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                  !categoryId ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted'
                )}>
                  <HelpCircleIcon className="size-5" />
                </span>
                <span className="text-xs font-semibold truncate max-w-full">Khác</span>
              </button>

              {/* Danh sách danh mục đã lọc */}
              {filteredCategories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    disabled={isSubmitting}
                    className={cn(
                      'group flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 aspect-square text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
                      isSubmitting && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                      isSelected ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted'
                    )}>
                      <IconPreview name={c.icon} className="size-5" />
                    </span>
                    <span className="text-xs font-semibold truncate max-w-full">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="tx-date">Ngày giao dịch</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="tx-date"
                  variant="outline"
                  className={cn(
                    'h-11 justify-start text-left font-normal rounded-xl border-border bg-card',
                    !date && 'text-muted-foreground'
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {date ? format(date, 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="button" className="rounded-xl" onClick={handleSubmit} disabled={isSubmitting || !isValid}>
              {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Cập nhật giao dịch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
