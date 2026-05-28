'use client';

import * as React from 'react';
import {
  ArrowDownCircleIcon,
  ArrowRightLeftIcon,
  ArrowUpCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  ReceiptTextIcon,
} from 'lucide-react';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';

import {
  formatVnd,
  typeAmountClass,
  typeAmountPrefix,
  typeBadgeClass,
  typeLabel,
} from '../../transactions/transaction-ui';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
};

// Định dạng ngày giờ chi tiết: HH:mm - dd/MM/yyyy
const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

// Hàng giao dịch lưu trữ (Chỉ xem)
function ArchivedTransactionRow({ t }: { t: TransactionWithCategory }) {
  const isIncome = t.type === 'income';
  const isTransfer = t.type === 'transfer';
  const AmountIcon = isTransfer ? ArrowRightLeftIcon : isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
  const amountIconClass = isTransfer ? 'text-blue-500' : isIncome ? 'text-emerald-500' : 'text-rose-500';
  const iconBgClass = isTransfer
    ? 'bg-blue-500/10 border-blue-500/20'
    : isIncome
      ? 'bg-emerald-500/10 border-emerald-500/20'
      : 'bg-rose-500/10 border-rose-500/20';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-gray-200 dark:bg-muted/20 shadow-xs transition-colors duration-300',
        isTransfer ? 'hover:border-blue-500/35' : isIncome ? 'hover:border-emerald-500/35' : 'hover:border-rose-500/35',
      )}
    >
      <div
        className={cn(
          'group relative z-10 flex items-center gap-4 bg-card p-4 transition-all duration-300 select-none',
          isTransfer
            ? 'hover:bg-blue-50/70 dark:hover:bg-blue-950/30'
            : isIncome
              ? 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30'
              : 'hover:bg-rose-50/70 dark:hover:bg-rose-950/30',
        )}
      >
        {/* Watermark icon chìm */}
        <div className="absolute -right-6 -bottom-6 pointer-events-none select-none opacity-[0.04] dark:opacity-[0.02] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
          {t.category?.icon ? (
            <IconPreview name={t.category.icon} className={cn('size-28', amountIconClass)} />
          ) : (
            <span className="inline-flex items-center justify-center text-8xl select-none leading-none font-normal">
              {t.type === 'transfer' ? '🔄' : '🏷️'}
            </span>
          )}
        </div>

        {/* Icon danh mục & Badge phụ thu/chi */}
        <div
          className={cn(
            'relative flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105',
            iconBgClass,
          )}
        >
          {t.category?.icon ? (
            <IconPreview name={t.category.icon} className={cn('size-5.5', amountIconClass)} />
          ) : (
            <span className="inline-flex items-center justify-center text-[1.375rem] select-none leading-none font-normal -translate-y-px">
              {t.type === 'transfer' ? '🔄' : '🏷️'}
            </span>
          )}
          <span
            className={cn(
              'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border bg-background shadow-xs text-[10px]',
              isIncome
                ? 'border-emerald-500/20 text-emerald-500'
                : isTransfer
                  ? 'border-blue-500/20 text-blue-500'
                  : 'border-rose-500/20 text-rose-500',
            )}
          >
            <AmountIcon className="size-3" aria-hidden />
          </span>
        </div>

        {/* Thông tin chính của giao dịch */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold text-sm leading-tight text-foreground transition-colors">
              {t.note || (t.category?.name ?? 'Khác')}
            </h4>
            <Badge
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] font-medium border leading-none shrink-0',
                typeBadgeClass(t.type),
              )}
            >
              {typeLabel(t.type)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {t.note && (
              <>
                <span className="font-medium text-foreground/75 truncate max-w-[120px]">
                  {t.category?.name ?? 'Khác'}
                </span>
                <span className="text-muted-foreground/40 font-light select-none">·</span>
              </>
            )}
            {t.account && (
              <>
                <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
                  <span className="text-[11px] leading-none select-none">{t.account.icon}</span>
                  <span>{t.account.name}</span>
                </span>
                {isTransfer && (
                  <>
                    <span className="text-blue-500 font-medium select-none">→</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
                      {t.to_account ? (
                        <>
                          <span className="text-[11px] leading-none select-none">{t.to_account.icon}</span>
                          <span>{t.to_account.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Tiền mặt</span>
                      )}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground/40 font-light select-none">·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <ClockIcon className="size-3 shrink-0 opacity-70" aria-hidden />
              <span>{formatTime(t.created_at)}</span>
            </div>
            {t.created_by_details?.display_name && (
              <>
                <span className="text-muted-foreground/40 font-light select-none">·</span>
                <span className="inline-flex items-center gap-0.5 text-muted-foreground/80" title={t.created_by_details.email}>
                  <span>Tạo bởi: <strong className="font-semibold text-foreground/75">{t.created_by_details.display_name}</strong></span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Số tiền */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className={cn('text-base font-bold tracking-tight transition-all duration-300', typeAmountClass(t.type))}>
              {typeAmountPrefix(t.type)}
              {formatVnd(t.amount)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card/60 p-4">
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export default function ArchivedTransactionsList({
  transactions,
  isLoading,
}: Props) {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border bg-card p-12 text-center shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted/30">
          <ReceiptTextIcon className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có giao dịch nào</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Không tìm thấy dữ liệu giao dịch cho nhóm đã lưu trữ này.
        </p>
      </div>
    );
  }

  // Gom nhóm giao dịch theo ngày
  const groupedTransactions = transactions.reduce<{ title: string; items: TransactionWithCategory[] }[]>((acc, t) => {
    const date = new Date(t.created_at);
    const dayOfWeek = date.getDay();
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayLabel = dayNames[dayOfWeek];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const title = `${dayLabel}, ${day}/${month}`;

    const existingGroup = acc.find((g) => g.title === title);
    if (existingGroup) {
      existingGroup.items.push(t);
    } else {
      acc.push({ title, items: [t] });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {groupedTransactions.map((group) => {
        const isCollapsed = collapsedGroups[group.title];

        // Tính tổng net của ngày (income - expense)
        const dayIncome = group.items.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const dayExpense = group.items.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const dayNet = dayIncome - dayExpense;
        const hasOnlyTransfer = dayIncome === 0 && dayExpense === 0;

        return (
          <div key={group.title} className="space-y-3">
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center gap-3 px-1 py-1 text-left select-none group/header hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 outline-none"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors group-hover/header:text-foreground">
                {group.title}
              </span>
              <ChevronDownIcon
                className={cn(
                  'size-3.5 text-muted-foreground/60 transition-transform duration-300 group-hover/header:text-foreground',
                  isCollapsed && '-rotate-90 text-muted-foreground/40',
                )}
              />
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] font-medium text-muted-foreground/60">{group.items.length} giao dịch</span>
              {!hasOnlyTransfer && (
                <span
                  className={cn(
                    'text-[11px] font-semibold tabular-nums',
                    dayNet > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : dayNet < 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-muted-foreground/60',
                  )}
                >
                  {dayNet > 0 ? '+' : ''}
                  {formatVnd(dayNet)}
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {group.items.map((t) => (
                  <ArchivedTransactionRow key={t.id} t={t} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
