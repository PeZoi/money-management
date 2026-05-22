import { format } from 'date-fns';
import { useState } from 'react';

import IconPreview from '@/components/icons/icon-preview';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { TransactionType, TransactionWithCategory } from '@/types/database';
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

import { useUpdateTransactionForm } from '../hooks/use-update-transaction-form';

type Props = {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
  const {
    form,
    type,
    accountId,
    toAccountId,
    amount,
    categoryId,
    isTransfer,
    filteredCategories,
    isDuplicateTransfer,
    isValid,
    isSubmitting,
    accounts,
    activeAccount,
    setAmount,
    handleClose,
    onSubmit,
    getCategoryClasses,
  } = useUpdateTransactionForm({ transaction, open, onOpenChange, onSuccess });

  const note = form.watch('note');
  const date = form.watch('date');

  // State cho popover tài khoản
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [openAccount, setOpenAccount] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const typeConfig = TYPE_CONFIG[type as TransactionType];
  const TypeIcon = typeConfig.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6 flex flex-row items-center gap-4">
          <DialogTitle>Cập nhật giao dịch</DialogTitle>
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold select-none',
              typeConfig.badgeBg,
              typeConfig.badgeText,
            )}
          >
            <TypeIcon className="size-3.5" />
            <span>{typeConfig.label}</span>
          </div>
        </DialogHeader>

        {/* Phần thân form chứa các trường nhập liệu có khả năng cuộn độc lập */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
          {/* Tên giao dịch (Lưu trữ ở cột note) */}
          <div className="grid gap-2">
            <Label htmlFor="tx-note">Tên giao dịch</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(e) => form.setValue('note', e.target.value)}
              placeholder={isTransfer ? 'Ví dụ: Chuyển sang VPBank, rút ATM…' : 'Ví dụ: Ăn trưa, xăng xe, mua sắm…'}
              className="h-11 rounded-xl"
              disabled={isSubmitting}
            />
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="tx-amount" className={cn(form.formState.errors.amount && 'text-destructive')}>
              Số tiền (VND)
            </Label>
            <Input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={cn(
                'h-12 rounded-xl text-lg font-semibold transition-all duration-200',
                form.formState.errors.amount && 'border-destructive focus-visible:ring-destructive text-destructive',
              )}
              disabled={isSubmitting}
            />
            {form.formState.errors.amount && (
              <p className="text-xs font-medium text-destructive mt-0.5">{form.formState.errors.amount.message}</p>
            )}
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
                              form.setValue('accountId', acc.id);
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
                              form.setValue('toAccountId', acc.id);
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
                              form.setValue('accountId', acc.id);
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
                {(() => {
                  const classes = getCategoryClasses(!categoryId);
                  return (
                    <button
                      type="button"
                      onClick={() => form.setValue('categoryId', '')}
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
                      onClick={() => form.setValue('categoryId', c.id)}
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
            <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
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
                  onSelect={(newDate) => {
                    if (newDate) {
                      form.setValue('date', newDate);
                      setOpenCalendar(false);
                    }
                  }}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Phần nút điều khiển (Footer) được cố định ở chân dialog */}
        <div className="border-t px-5 py-4 sm:px-6 bg-muted/10 shrink-0 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button type="button" className="rounded-xl" onClick={onSubmit} disabled={isSubmitting || !isValid}>
            {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Cập nhật giao dịch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
