'use client';

import { TrendingDownIcon, TrendingUpIcon, WalletIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithCategory } from '@/types/database';
import { formatVnd } from '../transaction-ui';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
};

type StatCard = {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
};

export default function TransactionStatsCards({ transactions, isLoading }: Props) {
  const income = transactions.filter((t) => t.type === 'income');
  const expense = transactions.filter((t) => t.type === 'expense');

  const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = expense.reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const cards: StatCard[] = [
    {
      label: 'Số dư ròng',
      value: formatVnd(Math.abs(balance)),
      sub: balance >= 0 ? 'Còn dư' : 'Bội chi',
      icon: WalletIcon,
      colorClass: balance >= 0 ? 'text-primary' : 'text-rose-500',
      bgClass: balance >= 0 ? 'bg-primary/10' : 'bg-rose-500/10',
      borderClass: balance >= 0 ? 'border-primary/20' : 'border-rose-500/20',
    },
    {
      label: 'Tổng thu nhập',
      value: formatVnd(totalIncome),
      sub: `${income.length} giao dịch`,
      icon: TrendingUpIcon,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/20',
    },
    {
      label: 'Tổng chi tiêu',
      value: formatVnd(totalExpense),
      sub: `${expense.length} giao dịch`,
      icon: TrendingDownIcon,
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-7 w-32" />
            <Skeleton className="mt-2 h-3.5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`group relative overflow-hidden rounded-2xl border ${card.borderClass} bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
          >
            {/* Subtle gradient glow */}
            <div className={`pointer-events-none absolute inset-0 ${card.bgClass} opacity-30`} />

            <div className="relative flex items-start justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <span className={`inline-flex size-10 items-center justify-center rounded-xl border ${card.borderClass} ${card.bgClass}`}>
                <Icon className={`size-5 ${card.colorClass}`} aria-hidden />
              </span>
            </div>
            <p className={`relative mt-3 text-2xl font-bold tracking-tight ${card.colorClass}`}>
              {card.value}
            </p>
            <p className="relative mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
