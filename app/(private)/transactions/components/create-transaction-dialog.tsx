'use client';
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
import type { TransactionType } from '@/types/database';
import {
  ArrowRightLeftIcon,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  CreditCardIcon,
  Loader2Icon,
  PencilLineIcon,
  SparklesIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react';
import Link from 'next/link';

import { useTransactionSuggestions } from '@/hooks/use-transactions';
import { useCreateTransactionForm, type CreateDialogTab } from '../hooks/use-create-transaction-form';
import { formatVnd } from '../transaction-ui';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

// Cấu hình tab
const TAB_OPTIONS: { value: CreateDialogTab; label: string; icon: typeof ZapIcon }[] = [
  { value: 'auto', label: 'Tự động', icon: ZapIcon },
  { value: 'manual', label: 'Thủ công', icon: PencilLineIcon },
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
  accounts: { id: string; name: string; icon: string; balance?: number | string; is_system?: boolean }[];
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
      <Popover open={open} onOpenChange={setOpen} modal={true}>
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
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted text-left',
                      isSelected && 'bg-primary/5 text-primary font-medium',
                    )}
                  >
                    <span className="text-base select-none">{acc.icon}</span>
                    <span className="flex-1 truncate">{acc.name}</span>
                    {/* Badge ưu tiên: Mặc định > Ngoài hệ thống */}
                    {acc.id === activeAccount?.id ? (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Mặc định
                      </span>
                    ) : acc.is_system === false ? (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        Ngoài hệ thống
                      </span>
                    ) : null}
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
  const {
    // Tab state
    activeTab,
    setActiveTab,

    // Auto tab
    autoNote,
    setAutoNote,
    autoAccountId,
    setAutoAccountId,
    autoDate,
    setAutoDate,
    isParsing,
    handleAutoSubmit,

    // Manual tab
    form,
    type,
    accountId,
    toAccountId,
    amount,
    categoryId,
    isTransfer,
    filteredCategories,
    numAmount,
    isDuplicateTransfer,
    isValid,
    isSubmitting,
    accounts,
    activeAccount,
    setType,
    setAmount,
    handleClose,
    onSubmit,
    getCategoryClasses,
    sourcePreviewData,
    destPreviewData,
  } = useCreateTransactionForm({ open, onOpenChange, onSuccess });

  const note = form.watch('note');
  const date = form.watch('date');
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openAutoCalendar, setOpenAutoCalendar] = useState(false);

  // Autocomplete cho tab thủ công
  const { suggestions } = useTransactionSuggestions();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const filteredSuggestions = suggestions
    .filter((s) => !note || s.toLowerCase().includes(note.toLowerCase()))
    .slice(0, 5);

  const renderSourcePreview = () => {
    if (!sourcePreviewData) return null;
    const { curBalance, nextBalance } = sourcePreviewData;
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

  const renderDestPreview = () => {
    if (!destPreviewData) return null;
    const { curBalance, nextBalance } = destPreviewData;
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>Thêm giao dịch mới</DialogTitle>

          {/* Tab Switcher */}
          <div className="flex gap-1 mt-3 bg-muted/50 rounded-xl p-1">
            {TAB_OPTIONS.map((tab) => {
              const isActive = activeTab === tab.value;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  disabled={isSubmitting || isParsing}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                    (isSubmitting || isParsing) && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <TabIcon className="size-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* =================== TAB TỰ ĐỘNG =================== */}
        {activeTab === 'auto' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
              {/* Ô nhập mô tả giao dịch */}
              <div className="grid gap-2">
                <Label htmlFor="auto-note" className="flex items-center gap-1.5">
                  <SparklesIcon className="size-3.5 text-amber-500" />
                  Mô tả giao dịch
                </Label>
                <div className="relative">
                  <Input
                    id="auto-note"
                    value={autoNote}
                    onChange={(e) => setAutoNote(e.target.value)}
                    placeholder="Ví dụ: Ăn trưa 150k, Nhận lương 15tr, Cafe 45k với bạn..."
                    className="h-12 rounded-xl text-base pr-3"
                    disabled={isSubmitting || isParsing}
                    autoComplete="off"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAutoSubmit();
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nhập một câu mô tả tự nhiên. Hệ thống sẽ tự nhận dạng số tiền, loại giao dịch và danh mục phù hợp.
                </p>
              </div>


              {/* Chọn tài khoản */}
              <AccountSelector
                id="auto-account"
                label="Tài khoản"
                accountId={autoAccountId}
                onSelect={setAutoAccountId}
                accounts={accounts}
                activeAccount={activeAccount}
                disabled={isSubmitting || isParsing}
              />

              {/* Chọn ngày */}
              <div className="grid gap-2">
                <Label htmlFor="auto-date">Ngày giao dịch</Label>
                <Popover open={openAutoCalendar} onOpenChange={setOpenAutoCalendar} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      id="auto-date"
                      variant="outline"
                      className={cn(
                        'h-11 justify-start text-left font-normal rounded-xl border-border bg-card',
                        !autoDate && 'text-muted-foreground',
                      )}
                      disabled={isSubmitting || isParsing}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {autoDate ? format(autoDate, 'dd/MM/yyyy') : <span>Chọn ngày</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={autoDate}
                      onSelect={(newDate) => {
                        if (newDate) {
                          setAutoDate(newDate);
                          setOpenAutoCalendar(false);
                        }
                      }}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Trạng thái đang phân tích AI */}
              {isParsing && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-pulse">
                  <div className="relative flex size-8 items-center justify-center">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                    <SparklesIcon className="absolute size-2.5 text-primary animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">Đang phân tích giao dịch...</p>
                    <p className="text-xs text-muted-foreground">AI đang nhận dạng số tiền, loại và danh mục</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Tab Tự động */}
            <div className="border-t px-5 py-4 sm:px-6 bg-muted/10 shrink-0 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleClose(false)}
                disabled={isSubmitting || isParsing}
              >
                Hủy
              </Button>
              <Button
                type="button"
                className="rounded-xl gap-1.5"
                onClick={handleAutoSubmit}
                disabled={isSubmitting || isParsing || !autoNote.trim() || !autoAccountId}
              >
                {isParsing ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SparklesIcon className="size-4" />
                )}
                {isParsing ? 'Đang phân tích...' : 'Thêm giao dịch'}
              </Button>
            </div>
          </>
        )}

        {/* =================== TAB THỦ CÔNG =================== */}
        {activeTab === 'manual' && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
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
                        onClick={() => setType(opt.value)}
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
                              'flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors text-xl',
                              classes.iconSpan,
                            )}
                          >
                            🏷️
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

              {/* Tài khoản — UI khác nhau tùy theo loại giao dịch */}
              {isTransfer ? (
                <>
                  {/* Transfer: 2 selector — Từ tài khoản & Đến tài khoản */}
                  <div className="space-y-4">
                    <AccountSelector
                      id="tx-from-account"
                      label="Từ tài khoản"
                      accountId={accountId}
                      onSelect={(id) => form.setValue('accountId', id)}
                      accounts={accounts}
                      activeAccount={activeAccount}
                      disabled={isSubmitting}
                      icon={CreditCardIcon}
                      preview={renderSourcePreview()}
                    />
                    <AccountSelector
                      id="tx-to-account"
                      label="Đến tài khoản"
                      accountId={toAccountId ?? ''}
                      onSelect={(id) => form.setValue('toAccountId', id)}
                      accounts={accounts}
                      activeAccount={activeAccount}
                      disabled={isSubmitting}
                      placeholder="Chọn tài khoản nhận"
                      icon={WalletIcon}
                      preview={renderDestPreview()}
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
                  onSelect={(id) => form.setValue('accountId', id)}
                  accounts={accounts}
                  activeAccount={activeAccount}
                  disabled={isSubmitting}
                  preview={renderSourcePreview()}
                />
              )}

              {/* Tên giao dịch (Lưu trữ ở cột note) */}
              <div className="grid gap-2">
                <Label htmlFor="tx-note">Tên giao dịch</Label>
                <div className="relative">
                  <Input
                    id="tx-note"
                    value={note}
                    onChange={(e) => {
                      form.setValue('note', e.target.value);
                      setActiveSuggestionIndex(-1);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        setShowSuggestions(false);
                      }, 200);
                    }}
                    onKeyDown={(e) => {
                      if (!showSuggestions || filteredSuggestions.length === 0) return;

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestionIndex((prev) =>
                          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestionIndex((prev) =>
                          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                        );
                      } else if (e.key === 'Enter') {
                        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredSuggestions.length) {
                          e.preventDefault();
                          form.setValue('note', filteredSuggestions[activeSuggestionIndex]);
                          setShowSuggestions(false);
                          setActiveSuggestionIndex(-1);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                        setActiveSuggestionIndex(-1);
                      }
                    }}
                    placeholder={isTransfer ? 'Ví dụ: Chuyển sang VPBank, rút ATM…' : 'Ví dụ: Ăn trưa, xăng xe, mua sắm…'}
                    className="h-11 rounded-xl"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />

                  {/* Dropdown gợi ý */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-[220px] overflow-y-auto p-1">
                      {filteredSuggestions.map((suggestion, index) => {
                        const isActive = index === activeSuggestionIndex;
                        return (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={() => {
                              form.setValue('note', suggestion);
                              setShowSuggestions(false);
                              setActiveSuggestionIndex(-1);
                            }}
                            className={cn(
                              'flex w-full items-center rounded-lg px-3 py-2 text-sm text-left transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-muted text-foreground'
                            )}
                          >
                            <span className="truncate">{suggestion}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
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

              {/* Date */}
              <div className="grid gap-2">
                <Label htmlFor="tx-date">Ngày giao dịch</Label>
                <Popover open={openCalendar} onOpenChange={setOpenCalendar} modal={true}>
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

            {/* Footer Tab Thủ công */}
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
                Thêm giao dịch
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
