import type { AccountRow } from '@/types/database';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { AccountCard } from './account-card';

interface AccountSummaryProps {
  account?: AccountRow | null;
  isLoading?: boolean;
  totalIncome: number;
  totalExpense: number;
}

export function AccountSummary({ account, isLoading, totalIncome, totalExpense }: AccountSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Thẻ tài khoản - Chiếm full width trên mobile, 1 cột trên desktop */}
      <div className="col-span-2 md:col-span-1">
        <AccountCard account={account} isLoading={isLoading} />
      </div>

      {/* Tổng Thu */}
      <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-44">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tổng Thu</span>
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <TrendingUpIcon className="size-4 sm:size-4.5" />
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
            +{totalIncome.toLocaleString('vi-VN')}₫
          </p>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 block">Trong chu kỳ lọc</span>
        </div>
      </div>

      {/* Tổng Chi */}
      <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-2xl border border-rose-500/10 bg-rose-500/5 dark:bg-rose-500/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-44">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tổng Chi</span>
          <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-xs">
            <TrendingDownIcon className="size-4 sm:size-4.5" />
          </div>
        </div>
        <div className="mt-auto">
          <p className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400 tabular-nums truncate">
            -{totalExpense.toLocaleString('vi-VN')}₫
          </p>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 block">Trong chu kỳ lọc</span>
        </div>
      </div>
    </div>
  );
}
