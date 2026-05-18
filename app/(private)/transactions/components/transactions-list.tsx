'use client';

import { ArrowDownCircleIcon, ArrowUpCircleIcon, CalendarIcon, PlusIcon, ReceiptTextIcon, Trash2Icon } from 'lucide-react';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';

import {
  formatDate,
  formatVnd,
  typeBadgeClass,
  typeAmountClass,
  typeAmountPrefix,
  typeLabel,
} from '../transaction-ui';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onRequestCreate: () => void;
  onRequestDelete: (id: string) => void;
};

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

export default function TransactionsList({
  transactions,
  isLoading,
  onRequestCreate,
  onRequestDelete,
}: Props) {
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
      <div className="rounded-2xl border bg-card p-12 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted/30">
          <ReceiptTextIcon className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-base font-semibold">Chưa có giao dịch nào</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy ghi nhận giao dịch đầu tiên để theo dõi thu &amp; chi của bạn.
        </p>
        <Button type="button" className="mt-6 rounded-xl" onClick={onRequestCreate}>
          <PlusIcon className="mr-2 size-4" aria-hidden />
          Thêm giao dịch
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {transactions.map((t) => {
        const isIncome = t.type === 'income';
        const AmountIcon = isIncome ? ArrowUpCircleIcon : ArrowDownCircleIcon;
        const amountIconClass = isIncome
          ? 'text-emerald-500'
          : 'text-rose-500';
        const iconBgClass = isIncome
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-rose-500/10 border-rose-500/20';

        return (
          <div
            key={t.id}
            className={cn(
              'group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-card/70 p-4 shadow-sm',
              'transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-card',
            )}
          >
            {/* Category / type icon */}
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl border',
                iconBgClass,
              )}
            >
              {t.category?.icon ? (
                <IconPreview name={t.category.icon} className={cn('size-5', amountIconClass)} />
              ) : (
                <AmountIcon className={cn('size-5', amountIconClass)} aria-hidden />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">
                  {t.category?.name ?? (isIncome ? 'Thu nhập' : 'Chi tiêu')}
                </p>
                <Badge
                  className={cn(
                    'hidden shrink-0 rounded-lg border text-xs sm:inline-flex',
                    typeBadgeClass(t.type),
                  )}
                >
                  {typeLabel(t.type)}
                </Badge>
              </div>
              {t.note && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.note}</p>
              )}
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="size-3" aria-hidden />
                <span>{formatDate(t.created_at)}</span>
              </div>
            </div>

            {/* Amount + delete */}
            <div className="flex shrink-0 flex-col items-end gap-2">
              <p className={cn('text-base font-bold tracking-tight', typeAmountClass(t.type))}>
                {typeAmountPrefix(t.type)}{formatVnd(t.amount)}
              </p>
              <button
                type="button"
                aria-label="Xóa giao dịch"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(t.id);
                }}
                className={cn(
                  'inline-flex size-7 items-center justify-center rounded-lg border text-muted-foreground',
                  'opacity-0 transition-all group-hover:opacity-100',
                  'hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-600',
                )}
              >
                <Trash2Icon className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
