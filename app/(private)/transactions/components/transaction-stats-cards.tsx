'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeftIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  EyeIcon,
  EyeOffIcon,
  SparklesIcon,
  InfoIcon,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithCategory } from '@/types/database';
import { formatVnd } from '../transaction-ui';
import { cn } from '@/lib/utils';

type Props = {
  transactions: TransactionWithCategory[];
  isLoading: boolean;
};

export default function TransactionStatsCards({ transactions, isLoading }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Khôi phục tùy chọn ẩn/hiện số dư từ localStorage và đánh dấu mounted
  useEffect(() => {
    const saved = localStorage.getItem('money-management-show-balance');
    const isTrue = saved !== null ? saved === 'true' : true;

    // Gom nhóm cập nhật state vào một luồng bất đồng bộ để tránh linter warning và tối ưu render
    setTimeout(() => {
      setShowBalance(isTrue);
      setIsMounted(true);
    }, 0);
  }, []);

  const toggleBalance = () => {
    const newVal = !showBalance;
    setShowBalance(newVal);
    localStorage.setItem('money-management-show-balance', String(newVal));
  };

  // Memoize các phép toán lọc và tính toán dòng tiền để tránh chạy lại khi toggle showBalance
  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income');
    const expense = transactions.filter((t) => t.type === 'expense');
    const transfer = transactions.filter((t) => t.type === 'transfer');

    const totalIncome = income.reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = expense.reduce((s, t) => s + Number(t.amount), 0);
    const totalTransfer = transfer.reduce((s, t) => s + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    return {
      incomeCount: income.length,
      expenseCount: expense.length,
      transferCount: transfer.length,
      totalIncome,
      totalExpense,
      totalTransfer,
      balance,
    };
  }, [transactions]);

  const { incomeCount, expenseCount, transferCount, totalIncome, totalExpense, totalTransfer, balance } = stats;

  const displayValue = (val: number, isNegative = false) => {
    if (!showBalance) return '•••••• ₫';
    return `${isNegative ? '-' : ''}${formatVnd(val)}`;
  };

  // Tính tỷ lệ chi tiêu so với thu nhập
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const percent = Math.min(expenseRatio, 100);

  let progressColor = 'bg-emerald-500 shadow-xs shadow-emerald-500/30';
  let ratioText = '';
  let ratioColor = 'text-emerald-600 dark:text-emerald-400';

  if (expenseRatio > 80) {
    progressColor = 'bg-rose-500 shadow-xs shadow-rose-500/30';
    ratioText = `Cảnh báo: Chi tiêu quá cao (${expenseRatio.toFixed(0)}% thu nhập)`;
    ratioColor = 'text-rose-600 dark:text-rose-400 font-semibold';
  } else if (expenseRatio > 50) {
    progressColor = 'bg-amber-500 shadow-xs shadow-amber-500/30';
    ratioText = `Cân đối: Chi tiêu chiếm ${expenseRatio.toFixed(0)}% thu nhập`;
    ratioColor = 'text-amber-600 dark:text-amber-400';
  } else if (totalIncome > 0) {
    ratioText = `An toàn: Tiết kiệm được ${(100 - expenseRatio).toFixed(0)}% thu nhập!`;
    ratioColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (totalExpense > 0) {
    ratioText = 'Chưa có thu nhập tháng này để đối chiếu chi tiêu';
    ratioColor = 'text-muted-foreground';
  } else {
    ratioText = 'Chưa phát sinh giao dịch thu chi';
    ratioColor = 'text-muted-foreground';
  }

  // Render skeleton khi đang tải dữ liệu hoặc component chưa được mount trên client
  if (isLoading || !isMounted) {
    return (
      <div className="w-full rounded-3xl border bg-card p-5 sm:p-6 shadow-xs animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 rounded-2xl bg-muted/40 p-5 flex flex-col justify-between h-[180px]">
            <div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-6 rounded-md" />
              </div>
              <Skeleton className="mt-5 h-8 w-40" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="md:col-span-7 flex flex-col justify-between py-1 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl border bg-card/60 backdrop-blur-md shadow-lg p-5 sm:p-6 transition-all hover:shadow-xl duration-300">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* 📊 LEFT SECTION: Monthly Net Result Spotlight */}
        <div className="md:col-span-5 flex flex-col justify-between relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50/50 via-slate-50 to-emerald-50/30 dark:from-indigo-950/30 dark:via-slate-900/40 dark:to-emerald-950/20 p-5 shadow-xs border border-muted/80 dark:border-white/5 min-h-[190px] group/spotlight">
          {/* Họa tiết vòng tròn mờ phản quang tạo độ sâu */}
          <div className="absolute -right-6 -top-6 size-32 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-xl group-hover/spotlight:scale-110 transition-transform duration-500 pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-32 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl group-hover/spotlight:scale-110 transition-transform duration-500 pointer-events-none" />

          {/* Top row: Section title & Hide/Show button */}
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <WalletIcon className="size-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng Kết Số Dư</span>
            </div>
            <button
              onClick={toggleBalance}
              type="button"
              className="flex size-7 items-center justify-center rounded-lg bg-muted/80 dark:bg-white/5 border border-muted-foreground/10 hover:bg-muted dark:hover:bg-white/10 transition-all active:scale-90"
              title={showBalance ? 'Ẩn số tiền' : 'Hiển thị số tiền'}
            >
              {showBalance ? (
                <EyeOffIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              ) : (
                <EyeIcon className="size-3.5 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>

          {/* Middle: Prominent Net Balance Display */}
          <div className="relative z-10 my-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Số dư ròng trong tháng
            </span>
            <h3
              className={cn(
                'text-2xl sm:text-3xl font-black tracking-tight transition-all duration-300',
                balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
              )}
            >
              {displayValue(Math.abs(balance), balance < 0)}
            </h3>
          </div>

          {/* Bottom: Status Badge & Quick summary text */}
          <div className="relative z-10 flex flex-col gap-2 pt-2 border-t border-muted/60 dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Trạng thái dòng tiền:</span>
              {balance >= 0 ? (
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase animate-pulse">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  Thặng dư
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase">
                  <span className="size-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                  Thâm hụt
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📊 RIGHT SECTION: Detailed Financial Flows */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-1">
              <SparklesIcon className="size-4 text-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chi tiết dòng tiền tháng này
              </span>
            </div>

            {/* Income Stream */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-all duration-200 group/item">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs shadow-emerald-500/5 group-hover/item:scale-105 transition-transform duration-200">
                  <TrendingUpIcon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Tổng thu nhập</p>
                  <p className="text-[10px] text-muted-foreground">{incomeCount} giao dịch</p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {showBalance ? `+${formatVnd(totalIncome)}` : '•••••• ₫'}
              </p>
            </div>

            {/* Expense Stream */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-all duration-200 group/item">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs shadow-rose-500/5 group-hover/item:scale-105 transition-transform duration-200">
                  <TrendingDownIcon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Tổng chi tiêu</p>
                  <p className="text-[10px] text-muted-foreground">{expenseCount} giao dịch</p>
                </div>
              </div>
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                {showBalance ? `-${formatVnd(totalExpense)}` : '•••••• ₫'}
              </p>
            </div>

            {/* Transfer Stream */}
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/40 transition-all duration-200 group/item">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs shadow-blue-500/5 group-hover/item:scale-105 transition-transform duration-200">
                  <ArrowRightLeftIcon className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">Chuyển tiền</p>
                  <p className="text-[10px] text-muted-foreground">{transferCount} giao dịch</p>
                </div>
              </div>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {showBalance ? formatVnd(totalTransfer) : '•••••• ₫'}
              </p>
            </div>
          </div>

          {/* Spend Performance progress bar & feedback text */}
          <div className="mt-4 pt-3 border-t border-muted">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <InfoIcon className="size-3.5" />
                <span>Hiệu suất chi tiêu</span>
              </span>
              <span className={cn('text-[11px] font-medium', ratioColor)}>{ratioText}</span>
            </div>
            {totalIncome > 0 && (
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden relative">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', progressColor)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
