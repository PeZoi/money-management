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
import { useAccounts } from '@/hooks/use-accounts';
import { cn } from '@/lib/utils';
import type { TransactionType, TransactionWithCategory } from '@/types/database';
import {
  ArrowRightLeftIcon,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  CreditCardIcon,
  HelpCircleIcon,
  Loader2Icon,
  LockIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';

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

const TYPE_CONFIG = {
  expense: {
    label: 'Chi tiêu',
    icon: TrendingDownIcon,
    badgeBg: 'bg-rose-500/10 border-rose-500/20',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  income: {
    label: 'Thu nhập',
    icon: TrendingUpIcon,
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  transfer: {
    label: 'Chuyển tiền',
    icon: ArrowRightLeftIcon,
    badgeBg: 'bg-blue-500/10 border-blue-500/20',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
};

export default function UpdateTransactionDialog({ transaction, open, onOpenChange, onSuccess }: Props) {
  const { categories } = useCategories();
  const { isSubmitting, updateTransaction } = useTransactionMutation();
  const { accounts, activeAccount } = useAccounts();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState('');
  // Sử dụng Date đối tượng trực tiếp thay vì chuỗi
  const [date, setDate] = useState<Date>(() => new Date());
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');

  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);

  const isTransfer = type === 'transfer';

  // Cập nhật giá trị form khi transaction thay đổi hoặc modal được mở
  useEffect(() => {
    if (transaction) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(formatAmountInput(transaction.amount.toString()));
      setType(transaction.type);
      setCategoryId(transaction.category_id || '');
      setNote(transaction.note || '');
      setAccountId(transaction.account_id || '');
      setToAccountId(transaction.to_account_id || '');

      // Chuyển đổi created_at từ DB sang đối tượng Date
      if (transaction.created_at) {
        setDate(new Date(transaction.created_at));
      } else {
        setDate(new Date());
      }
    }
  }, [transaction, open]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!transaction) return;
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) return;

    // Validate transfer
    if (isTransfer) {
      if (!accountId || !toAccountId) return;
      if (toAccountId === accountId) return;
    }

    // Tránh lệch múi giờ, đồng thời lấy chính xác giờ phút giây hiện tại thay vì mặc định 12:00:00
    const now = new Date();
    const formattedCreatedAt = date
      ? new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
        ).toISOString()
      : null;

    const ok = await updateTransaction(
      transaction.id,
      {
        amount: numAmount,
        category_id: isTransfer ? null : categoryId || null,
        note: note.trim() || null,
        created_at: formattedCreatedAt,
        account_id: accountId || null,
        to_account_id: isTransfer ? toAccountId || null : null,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          handleClose(false);
        },
      },
    );
    if (!ok) return;
  };

  const isDuplicateTransfer = isTransfer && accountId && toAccountId && accountId === toAccountId;

  const isValid =
    Number(amount.replace(/[^0-9]/g, '')) > 0 &&
    (isTransfer ? accountId && toAccountId && !isDuplicateTransfer : accountId);

  const typeConfig = TYPE_CONFIG[type];
  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>Cập nhật giao dịch</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* Type selector (Read-only khi Update) */}
          <div className="grid gap-2">
            <Label>Loại giao dịch</Label>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border font-semibold text-sm',
                  typeConfig.badgeBg,
                  typeConfig.badgeText,
                )}
              >
                <TypeIcon className="size-4 mr-1" />
                <span>{typeConfig.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-xl border">
                <LockIcon className="size-3.5 text-muted-foreground/75" />
                <span>Không thể thay đổi loại giao dịch</span>
              </div>
            </div>
          </div>

          {/* Tên giao dịch (Lưu trữ ở cột note) */}
          <div className="grid gap-2">
            <Label htmlFor="tx-note">Tên giao dịch</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isTransfer ? 'Ví dụ: Chuyển sang VPBank, rút ATM…' : 'Ví dụ: Ăn trưa, xăng xe, mua sắm…'}
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

          {/* Tài khoản */}
          {isTransfer ? (
            <>
              {/* Transfer: Từ tài khoản & Đến tài khoản */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="tx-from-account">Từ tài khoản</Label>
                  <Popover open={openFrom} onOpenChange={setOpenFrom}>
                    <PopoverTrigger asChild>
                      <Button
                        id="tx-from-account"
                        variant="outline"
                        className={cn(
                          'h-11 justify-between text-left font-normal rounded-xl border-border bg-card',
                          !accountId && 'text-muted-foreground',
                        )}
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCardIcon className="size-4 text-muted-foreground" />
                          {selectedAccount ? (
                            <span className="font-medium text-foreground">
                              {selectedAccount.icon} {selectedAccount.name}
                            </span>
                          ) : (
                            <span>Chọn tài khoản nguồn</span>
                          )}
                        </div>
                        <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {accounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setAccountId(acc.id);
                              setOpenFrom(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted text-left',
                              accountId === acc.id && 'bg-primary/5 text-primary font-medium',
                            )}
                          >
                            <span className="text-base select-none">{acc.icon}</span>
                            <span className="flex-1 truncate">{acc.name}</span>
                            {acc.id === activeAccount?.id && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                Mặc định
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tx-to-account">Đến tài khoản</Label>
                  <Popover open={openTo} onOpenChange={setOpenTo}>
                    <PopoverTrigger asChild>
                      <Button
                        id="tx-to-account"
                        variant="outline"
                        className={cn(
                          'h-11 justify-between text-left font-normal rounded-xl border-border bg-card',
                          !toAccountId && 'text-muted-foreground',
                        )}
                        disabled={isSubmitting}
                      >
                        <div className="flex items-center gap-2">
                          <WalletIcon className="size-4 text-muted-foreground" />
                          {selectedToAccount ? (
                            <span className="font-medium text-foreground">
                              {selectedToAccount.icon} {selectedToAccount.name}
                            </span>
                          ) : (
                            <span>Chọn tài khoản nhận</span>
                          )}
                        </div>
                        <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {accounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setToAccountId(acc.id);
                              setOpenTo(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted text-left',
                              toAccountId === acc.id && 'bg-primary/5 text-primary font-medium',
                            )}
                          >
                            <span className="text-base select-none">{acc.icon}</span>
                            <span className="flex-1 truncate">{acc.name}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {isDuplicateTransfer && (
                  <p className="text-xs font-semibold text-rose-500 animate-pulse bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-lg">
                    Tài khoản nguồn và tài khoản đích không được trùng nhau!
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Expense / Income: 1 selector tài khoản */
            <div className="grid gap-2">
              <Label htmlFor="tx-account">Tài khoản</Label>
              <Popover open={openAccount} onOpenChange={setOpenAccount}>
                <PopoverTrigger asChild>
                  <Button
                    id="tx-account"
                    variant="outline"
                    className={cn(
                      'h-11 justify-between text-left font-normal rounded-xl border-border bg-card',
                      !accountId && 'text-muted-foreground',
                    )}
                    disabled={isSubmitting}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="size-4 text-muted-foreground" />
                      {selectedAccount ? (
                        <span className="font-medium text-foreground">
                          {selectedAccount.icon} {selectedAccount.name}
                        </span>
                      ) : (
                        <span>Chọn tài khoản</span>
                      )}
                    </div>
                    <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {accounts.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2 text-center">
                        Không có tài khoản nào. Hãy tạo tài khoản mới trước.{' '}
                        <Link href="/accounts" className="text-blue-500">
                          Quản lý tài khoản
                        </Link>
                      </p>
                    ) : (
                      accounts.map((acc) => {
                        const isSelected = accountId === acc.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setAccountId(acc.id);
                              setOpenAccount(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted text-left',
                              isSelected && 'bg-primary/5 text-primary font-medium',
                            )}
                          >
                            <span className="text-base select-none">{acc.icon}</span>
                            <span className="flex-1 truncate">{acc.name}</span>
                            {acc.id === activeAccount?.id && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                                Mặc định
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Category — Ẩn khi transfer */}
          {!isTransfer && (
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
                  <span
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                      !categoryId
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
                    )}
                  >
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
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                          isSelected
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
                        )}
                      >
                        <IconPreview name={c.icon} className="size-5" />
                      </span>
                      <span className="text-xs font-semibold truncate max-w-full">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                    !date && 'text-muted-foreground',
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
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
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
