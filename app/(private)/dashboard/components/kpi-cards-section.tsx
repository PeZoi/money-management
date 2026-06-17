'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { 
  WalletIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ScaleIcon, 
  ArrowUpRightIcon, 
  ArrowDownRightIcon, 
  SparklesIcon 
} from 'lucide-react';
import { formatVnd } from '@/app/(private)/transactions/transaction-ui';
import { staggerContainer, fadeSlideUp } from '@/lib/motion-variants';
import { Switch } from '@/components/ui/switch';

interface KpiCardsSectionProps {
  stats: {
    availableBalance: number;
    currentIncome: number;
    currentExpense: number;
    currentNet: number;
    incomePercent: number;
    expensePercent: number;
  };
  timeRange: 'week' | 'month' | 'year' | 'all';
  accountsCount: number;
  includeSavings: boolean;
  setIncludeSavings: (val: boolean) => void;
}

export function KpiCardsSection({
  stats,
  timeRange,
  accountsCount,
  includeSavings,
  setIncludeSavings,
}: KpiCardsSectionProps) {
  // Tính toán trước phần trăm làm tròn ở đầu component để tuân thủ Rules of Hooks
  const roundedIncomePercent = React.useMemo(() => Math.round(stats.incomePercent), [stats.incomePercent]);
  const roundedExpensePercent = React.useMemo(() => Math.round(stats.expensePercent), [stats.expensePercent]);
  const roundedSavingPercent = React.useMemo(() => {
    if (stats.currentIncome > 0 && stats.currentNet > 0) {
      return Math.round((stats.currentNet / stats.currentIncome) * 100);
    }
    return 0;
  }, [stats.currentNet, stats.currentIncome]);

  return (
    <m.div
      className="mt-6 grid auto-rows-min gap-4 grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      
      {/* Card 1: Available Balance */}
      <m.div 
        variants={fadeSlideUp}
        className="col-span-2 sm:col-span-1 rounded-3xl border bg-card/50 p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-blue-500/35 active:scale-98 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between min-h-[135px] cursor-pointer"
        onClick={() => {
          const el = document.getElementById('my-accounts-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <WalletIcon className="size-24 text-blue-500" />
        </div>
        
        {/* Hàng 1: Label & Icon */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Số dư khả dụng</span>
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="flex items-center gap-1 bg-background/55 hover:bg-background/80 dark:bg-card/45 dark:hover:bg-card/65 backdrop-blur-xs py-0.5 px-1.5 rounded-md border border-border/30 transition-colors w-fit text-[9px] font-medium text-muted-foreground"
            >
              <span>Gồm tiết kiệm</span>
              <Switch
                checked={includeSavings}
                onCheckedChange={setIncludeSavings}
                className="scale-65 origin-right cursor-pointer"
              />
            </div>
          </div>
          <div className="size-8.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shrink-0">
            <WalletIcon className="size-4" />
          </div>
        </div>

        {/* Hàng 2: Số tiền hiển thị độc lập */}
        <div className="mt-2 flex-1 flex items-end">
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight tabular-nums transition-transform duration-350 group-hover:scale-[1.02] origin-left truncate w-full">
            {formatVnd(stats.availableBalance)}
          </h3>
        </div>

        {/* Thông tin phụ ngắn gọn */}
        <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-medium select-none group-hover:text-foreground/80 transition-colors">
          Đang quản lý <span className="font-bold text-foreground">{accountsCount}</span> ví tài chính
        </div>
      </m.div>

      {/* Card 2: Income */}
      <m.div variants={fadeSlideUp} className="rounded-3xl border bg-card/50 p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-emerald-500/35 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between min-h-[135px]">
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <TrendingUpIcon className="size-24 text-emerald-500" />
        </div>
        
        {/* Hàng 1: Label & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">Tổng thu nhập</span>
          <div className="size-8.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shrink-0">
            <TrendingUpIcon className="size-4" />
          </div>
        </div>

        {/* Hàng 2: Số tiền */}
        <div className="mt-2 flex-1 flex items-end">
          <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums transition-transform duration-350 group-hover:scale-[1.02] origin-left truncate w-full">
            {formatVnd(stats.currentIncome)}
          </h3>
        </div>

        {/* So sánh chu kỳ trước */}
        {timeRange !== 'all' && (
          <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1 font-medium select-none">
            {stats.incomePercent >= 0 ? (
              <>
                <span className="inline-flex items-center gap-0.5 text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-105">
                  <ArrowUpRightIcon className="size-3" />
                  +{roundedIncomePercent}%
                </span>
                <span className="truncate">so với chu kỳ trước</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-105">
                  <ArrowDownRightIcon className="size-3" />
                  {roundedIncomePercent}%
                </span>
                <span className="truncate">so với chu kỳ trước</span>
              </>
            )}
          </div>
        )}
      </m.div>

      {/* Card 3: Expense */}
      <m.div variants={fadeSlideUp} className="rounded-3xl border bg-card/50 p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 hover:border-rose-500/35 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between min-h-[135px]">
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <TrendingDownIcon className="size-24 text-rose-500" />
        </div>

        {/* Hàng 1: Label & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">Tổng chi tiêu</span>
          <div className="size-8.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shrink-0">
            <TrendingDownIcon className="size-4" />
          </div>
        </div>

        {/* Hàng 2: Số tiền */}
        <div className="mt-2 flex-1 flex items-end">
          <h3 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums transition-transform duration-350 group-hover:scale-[1.02] origin-left truncate w-full">
            {formatVnd(stats.currentExpense)}
          </h3>
        </div>

        {/* So sánh chu kỳ trước */}
        {timeRange !== 'all' && (
          <div className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1 font-medium select-none">
            {stats.expensePercent >= 0 ? (
              <>
                <span className="inline-flex items-center gap-0.5 text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-105">
                  <ArrowUpRightIcon className="size-3" />
                  +{roundedExpensePercent}%
                </span>
                <span className="truncate">so với chu kỳ trước</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-0.5 text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-105">
                  <ArrowDownRightIcon className="size-3" />
                  {roundedExpensePercent}%
                </span>
                <span className="truncate">so với chu kỳ trước</span>
              </>
            )}
          </div>
        )}
      </m.div>

      {/* Card 4: Net Flow */}
      <m.div variants={fadeSlideUp} className={`col-span-2 sm:col-span-1 rounded-3xl border bg-card/50 p-5 backdrop-blur-md shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between min-h-[135px] ${
        stats.currentNet >= 0 ? 'hover:border-emerald-500/35' : 'hover:border-rose-500/35'
      }`}>
        <div className={`absolute -right-6 -bottom-6 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${
          stats.currentNet >= 0 ? 'text-emerald-500' : 'text-rose-500'
        }`}>
          <ScaleIcon className="size-24" />
        </div>

        {/* Hàng 1: Label & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">Dòng tiền thuần</span>
          <div className={`size-8.5 rounded-xl flex items-center justify-center border group-hover:scale-110 group-hover:text-white transition-all duration-300 shrink-0 ${
            stats.currentNet >= 0
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500 group-hover:bg-rose-500'
          }`}>
            {stats.currentNet >= 0 ? <SparklesIcon className="size-4 animate-pulse" /> : <ScaleIcon className="size-4" />}
          </div>
        </div>

        {/* Hàng 2: Số tiền */}
        <div className="mt-2 flex-1 flex items-end">
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight tabular-nums transition-transform duration-350 group-hover:scale-[1.02] origin-left truncate w-full ${
            stats.currentNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {stats.currentNet >= 0 ? '+' : ''}
            {formatVnd(stats.currentNet)}
          </h3>
        </div>

        {/* Thông điệp tích lũy */}
        <div className="mt-3 text-[10px] font-semibold text-muted-foreground select-none truncate group-hover:text-foreground/80 transition-colors">
          {stats.currentIncome > 0 && stats.currentNet > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Tích lũy được {roundedSavingPercent}% thu nhập
            </span>
          ) : stats.currentNet < 0 ? (
            <span className="text-rose-500 font-bold animate-pulse">
              Chi tiêu vượt thu nhập!
            </span>
          ) : (
            <span>Không có biến động tài chính</span>
          )}
        </div>
      </m.div>
    </m.div>
  );
}
