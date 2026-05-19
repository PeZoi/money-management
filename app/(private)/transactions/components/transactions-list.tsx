'use client';

import { ArrowDownCircleIcon, ArrowUpCircleIcon, ChevronDownIcon, ClockIcon, PlusIcon, ReceiptTextIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import IconPreview from '@/components/icons/icon-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';

import {
  formatVnd,
  typeAmountClass,
  typeAmountPrefix,
  typeBadgeClass,
  typeLabel
} from '../transaction-ui';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
  onRequestCreate: () => void;
  onRequestDelete: (id: string) => void;
  onRequestUpdate: (transaction: TransactionWithCategory) => void;
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
  onRequestUpdate,
}: Props) {
  // Trạng thái đóng/mở của mỗi nhóm ngày giao dịch
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

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

  // Gom nhóm giao dịch theo ngày cục bộ để đảm bảo chính xác múi giờ của người dùng
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

  // Định dạng ngày giờ chi tiết: HH : mm - dd/MM/yyyy
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

  return (
    <div className="space-y-6">
      {groupedTransactions.map((group) => {
        const isCollapsed = collapsedGroups[group.title];
        return (
          <div key={group.title} className="space-y-3">
            {/* Tiêu đề Section (Ngày giao dịch) được thiết kế thành nút bấm đóng/mở thông minh */}
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center gap-3 px-1 py-1 text-left select-none group/header hover:opacity-85 transition-opacity"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors group-hover/header:text-foreground">
                {group.title}
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-3.5 text-muted-foreground/60 transition-transform duration-300 group-hover/header:text-foreground",
                  isCollapsed && "-rotate-90 text-muted-foreground/40"
                )}
              />
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] font-medium text-muted-foreground/60">
                {group.items.length} giao dịch
              </span>
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                {group.items.map((t) => {
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
                      onClick={() => onRequestUpdate(t)}
                      className={cn(
                        'group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-4 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-md dark:bg-muted/10 dark:hover:bg-card',
                      )}
                    >
                      {/* Icon mờ nghệ thuật (watermark) lớn ở góc dưới bên phải */}
                      <div className="absolute -right-6 -bottom-6 pointer-events-none select-none opacity-[0.04] dark:opacity-[0.02] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {t.category?.icon ? (
                          <IconPreview name={t.category.icon} className={cn('size-28', amountIconClass)} />
                        ) : (
                          <AmountIcon className={cn('size-28', amountIconClass)} aria-hidden />
                        )}
                      </div>

                      {/* Bọc chứa Category Icon bo góc mềm mại & sub-badge thu/chi */}
                      <div
                        className={cn(
                          'relative flex size-12 shrink-0 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-105',
                          iconBgClass,
                        )}
                      >
                        {t.category?.icon ? (
                          <>
                            <IconPreview name={t.category.icon} className={cn('size-5.5', amountIconClass)} />
                            {/* Badge phụ góc dưới bên phải thể hiện thu/chi */}
                            <span className={cn(
                              'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border bg-background shadow-xs text-[10px]',
                              isIncome ? 'border-emerald-500/20 text-emerald-500' : 'border-rose-500/20 text-rose-500'
                            )}>
                              <AmountIcon className="size-3" aria-hidden />
                            </span>
                          </>
                        ) : (
                          <AmountIcon className={cn('size-6', amountIconClass)} aria-hidden />
                        )}
                      </div>

                      {/* Info phân cấp rõ ràng (Note > Category > Date) */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate font-semibold text-sm leading-tight text-foreground transition-colors ">
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
                          <div className="flex items-center gap-1">
                            <ClockIcon className="size-3 shrink-0 opacity-70" aria-hidden />
                            <span>{formatTime(t.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Số tiền & Nút xóa slide-in ngang tinh tế */}
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className={cn('text-base font-bold tracking-tight transition-all duration-300', typeAmountClass(t.type))}>
                            {typeAmountPrefix(t.type)}{formatVnd(t.amount)}
                          </p>
                        </div>

                        {/* Nút xóa slide-in thông minh */}
                        <div className="flex items-center justify-center w-0 opacity-0 overflow-hidden transition-all duration-300 group-hover:w-8 group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="Xóa giao dịch"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestDelete(t.id);
                            }}
                            className={cn(
                              'inline-flex size-8 items-center justify-center rounded-xl border border-border bg-background shadow-xs text-muted-foreground',
                              'transition-all duration-200 hover:scale-105 active:scale-95',
                              'hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:bg-rose-500/20',
                            )}
                          >
                            <Trash2Icon className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
