'use client';
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
import type { TransactionType } from '@/types/database';
import {
  ArrowRightLeftIcon,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  CreditCardIcon,
  HelpCircleIcon,
  Loader2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import Link from 'next/link';
import { formatVnd } from '../transaction-ui';

type Props = {
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

// Cấu hình hiển thị cho từng loại giao dịch
const TYPE_OPTIONS: {
  value: TransactionType;
  label: string;
  desc: string;
  icon: typeof TrendingDownIcon;
  selectedBorder: string;
  selectedBg: string;
  selectedRing: string;
  selectedIconBorder: string;
  selectedIconBg: string;
  selectedIconText: string;
  selectedLabelText: string;
}[] = [
  {
    value: 'expense',
    label: 'Chi tiêu',
    desc: 'Tiền ra, chi phí',
    icon: TrendingDownIcon,
    selectedBorder: 'border-rose-500/50',
    selectedBg: 'bg-rose-500/10',
    selectedRing: 'ring-2 ring-rose-500/25',
    selectedIconBorder: 'border-rose-500/30',
    selectedIconBg: 'bg-rose-500/15',
    selectedIconText: 'text-rose-600 dark:text-rose-400',
    selectedLabelText: 'text-rose-700 dark:text-rose-300',
  },
  {
    value: 'income',
    label: 'Thu nhập',
    desc: 'Tiền vào, nguồn thu',
    icon: TrendingUpIcon,
    selectedBorder: 'border-emerald-500/50',
    selectedBg: 'bg-emerald-500/10',
    selectedRing: 'ring-2 ring-emerald-500/25',
    selectedIconBorder: 'border-emerald-500/30',
    selectedIconBg: 'bg-emerald-500/15',
    selectedIconText: 'text-emerald-600 dark:text-emerald-400',
    selectedLabelText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'transfer',
    label: 'Chuyển tiền',
    desc: 'Giữa các tài khoản',
    icon: ArrowRightLeftIcon,
    selectedBorder: 'border-blue-500/50',
    selectedBg: 'bg-blue-500/10',
    selectedRing: 'ring-2 ring-blue-500/25',
    selectedIconBorder: 'border-blue-500/30',
    selectedIconBg: 'bg-blue-500/15',
    selectedIconText: 'text-blue-600 dark:text-blue-400',
    selectedLabelText: 'text-blue-700 dark:text-blue-300',
  },
];

// Component chọn tài khoản dùng chung cho cả nguồn và đích
function AccountSelector({
  id,
  label,
  accountId,
  onSelect,
  accounts,
  activeAccount,
  disabled,
  placeholder,
  icon: Icon,
  preview,
}: {
  id: string;
  label: string;
  accountId: string;
  onSelect: (id: string) => void;
  accounts: { id: string; name: string; icon: string; balance?: number | string }[];
  activeAccount: { id: string } | null;
  disabled: boolean;
  placeholder?: string;
  icon?: typeof CreditCardIcon;
  preview?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const IconComp = Icon ?? CreditCardIcon;
  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              'h-11 justify-between text-left font-normal rounded-xl border-border bg-card',
              !accountId && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <IconComp className="size-4 text-muted-foreground" />
              {selectedAccount ? (
                <span className="font-medium text-foreground">
                  {selectedAccount.icon} {selectedAccount.name}
                </span>
              ) : (
                <span>{placeholder ?? 'Chọn tài khoản'}</span>
              )}
            </div>
            <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">
                Không có tài khoản nào.{' '}
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
                      onSelect(acc.id);
                      setOpen(false); // Đóng popover ngay khi chọn xong
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
      {preview}
    </div>
  );
}

export default function CreateTransactionDialog({ open, onOpenChange, onSuccess }: Props) {
  const { categories } = useCategories();
  const { isSubmitting, createTransaction } = useTransactionMutation();
  // Lấy danh sách tài khoản và active account
  const { accounts, activeAccount } = useAccounts();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState('');
  // Sử dụng Date đối tượng trực tiếp thay vì chuỗi
  const [date, setDate] = useState<Date>(() => new Date());
  const [accountId, setAccountId] = useState<string>('');
  // Tài khoản đích cho giao dịch chuyển tiền
  const [toAccountId, setToAccountId] = useState<string>('');

  // Hàm helper lấy class CSS cho danh mục dựa vào loại giao dịch (Chi tiêu = Đỏ, Thu nhập = Xanh)
  const getCategoryClasses = (isSelected: boolean) => {
    if (!isSelected) {
      return {
        button: 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
        iconSpan: 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
      };
    }
    if (type === 'expense') {
      return {
        button: 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/20',
        iconSpan: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
      };
    }
    if (type === 'income') {
      return {
        button: 'border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20',
        iconSpan: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      };
    }
    return {
      button: 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20',
      iconSpan: 'border-primary/20 bg-primary/10 text-primary',
    };
  };

  // Tự động gán active account làm mặc định khi load xong dữ liệu tài khoản
  useEffect(() => {
    if (activeAccount && !accountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountId(activeAccount.id);
    }
  }, [activeAccount, accountId]);

  const isTransfer = type === 'transfer';

  const filteredCategories = categories.filter((c) => c.type === type);

  const numAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;

  const getSourcePreview = () => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return null;
    const curBalance = Number(acc.balance);
    const nextBalance = type === 'income' ? curBalance + numAmount : curBalance - numAmount;
    return (
      <p className="mt-0.5 text-xs text-muted-foreground/80 flex items-center gap-1">
        <span>Số dư:</span>
        <span className="font-semibold text-foreground">{formatVnd(curBalance)}</span>
        {numAmount > 0 && (
          <>
            <span className="text-muted-foreground/50">→</span>
            <span>Dự kiến:</span>
            <span
              className={cn(
                'font-semibold',
                nextBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {formatVnd(nextBalance)}
            </span>
          </>
        )}
      </p>
    );
  };

  const getDestPreview = () => {
    const acc = accounts.find((a) => a.id === toAccountId);
    if (!acc) return null;
    const curBalance = Number(acc.balance);
    const nextBalance = curBalance + numAmount;
    return (
      <p className="mt-0.5 text-xs text-muted-foreground/80 flex items-center gap-1">
        <span>Số dư:</span>
        <span className="font-semibold text-foreground">{formatVnd(curBalance)}</span>
        {numAmount > 0 && (
          <>
            <span className="text-muted-foreground/50">→</span>
            <span>Dự kiến:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatVnd(nextBalance)}</span>
          </>
        )}
      </p>
    );
  };

  const resetForm = () => {
    setAmount('');
    setType('expense');
    setCategoryId('');
    setNote('');
    setDate(new Date());
    setAccountId(activeAccount?.id ?? '');
    setToAccountId('');
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) return;

    // Validate transfer: phải có tài khoản nguồn, nguồn ≠ đích
    if (isTransfer) {
      if (!accountId) return;
      if (toAccountId && toAccountId === accountId) return;
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

    const ok = await createTransaction(
      {
        amount: numAmount,
        type,
        category_id: isTransfer ? null : categoryId || null,
        note: note.trim() || null,
        created_at: formattedCreatedAt,
        account_id: accountId || activeAccount?.id || null,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>Thêm giao dịch mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* Type selector — 3 options */}
          <div className="grid gap-2">
            <Label>Loại giao dịch</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = type === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setType(opt.value);
                      setCategoryId('');
                    }}
                    className={cn(
                      'group flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      isSelected
                        ? `${opt.selectedBorder} ${opt.selectedBg} ${opt.selectedRing}`
                        : 'border-border bg-card hover:bg-muted/50 text-muted-foreground',
                      isSubmitting && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={isSubmitting}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                        isSelected
                          ? `${opt.selectedIconBorder} ${opt.selectedIconBg} ${opt.selectedIconText}`
                          : 'border-border bg-muted/40 text-muted-foreground group-hover:bg-muted',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold tracking-tight transition-colors',
                        isSelected ? opt.selectedLabelText : 'text-foreground/95',
                      )}
                    >
                      {opt.label}
                    </span>
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

          {/* Tài khoản — UI khác nhau tùy theo loại giao dịch */}
          {isTransfer ? (
            <>
              {/* Transfer: 2 selector — Từ tài khoản & Đến tài khoản */}
              <div className="space-y-4">
                <AccountSelector
                  id="tx-from-account"
                  label="Từ tài khoản"
                  accountId={accountId}
                  onSelect={setAccountId}
                  accounts={accounts}
                  activeAccount={activeAccount}
                  disabled={isSubmitting}
                  icon={CreditCardIcon}
                  preview={getSourcePreview()}
                />
                <AccountSelector
                  id="tx-to-account"
                  label="Đến tài khoản"
                  accountId={toAccountId}
                  onSelect={setToAccountId}
                  accounts={accounts}
                  activeAccount={activeAccount}
                  disabled={isSubmitting}
                  placeholder="Chọn tài khoản nhận"
                  icon={WalletIcon}
                  preview={getDestPreview()}
                />
                {isDuplicateTransfer && (
                  <p className="text-xs font-semibold text-rose-500 animate-pulse bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-lg">
                    Tài khoản nguồn và tài khoản đích không được trùng nhau!
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Expense / Income: 1 selector tài khoản */
            <AccountSelector
              id="tx-account"
              label="Tài khoản"
              accountId={accountId}
              onSelect={setAccountId}
              accounts={accounts}
              activeAccount={activeAccount}
              disabled={isSubmitting}
              preview={getSourcePreview()}
            />
          )}

          {/* Category — Ẩn khi transfer */}
          {!isTransfer && (
            <div className="grid gap-2">
              <Label>Danh mục</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {/* Option "Khác" (mặc định / không chọn) */}
                {(() => {
                  const classes = getCategoryClasses(!categoryId);
                  return (
                    <button
                      type="button"
                      onClick={() => setCategoryId('')}
                      disabled={isSubmitting}
                      className={cn(
                        'group flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 aspect-square text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        classes.button,
                        isSubmitting && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                          classes.iconSpan,
                        )}
                      >
                        <HelpCircleIcon className="size-5" />
                      </span>
                      <span className="text-xs font-semibold truncate max-w-full">Khác</span>
                    </button>
                  );
                })()}

                {/* Danh sách danh mục đã lọc */}
                {filteredCategories.map((c) => {
                  const isSelected = categoryId === c.id;
                  const classes = getCategoryClasses(isSelected);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      disabled={isSubmitting}
                      className={cn(
                        'group flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 aspect-square text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        classes.button,
                        isSubmitting && 'cursor-not-allowed opacity-50',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                          classes.iconSpan,
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
              Thêm giao dịch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
