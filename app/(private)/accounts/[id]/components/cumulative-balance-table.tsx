'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';
import { ArrowUpDownIcon, ChevronRightIcon } from 'lucide-react';

interface StatsItem {
  label: string;
  key: string;
  income: number;
  expense: number;
  balance: number;
  transactions: TransactionWithCategory[];
}

interface CumulativeBalanceTableProps {
  isTxLoading: boolean;
  initialBalance: number;
  sortedStatsItems: StatsItem[];
  onSortDirectionChange: () => void;
  filterType: 'month' | 'year';
  year: number;
  onSelectBucket: (bucket: { label: string; transactions: TransactionWithCategory[] } | null) => void;
}

export function CumulativeBalanceTable({
  isTxLoading,
  initialBalance,
  sortedStatsItems,
  onSortDirectionChange,
  filterType,
  year,
  onSelectBucket,
}: CumulativeBalanceTableProps) {
  return (
    <div className="mt-8 border bg-card/65 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90">
            Thống kê số dư lũy kế
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Nhấp vào một dòng để xem danh sách giao dịch chi tiết phát sinh trong ngày/tháng đó.
          </p>
        </div>
        <Badge variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
          Số dư đầu kỳ: {initialBalance.toLocaleString('vi-VN')}₫
        </Badge>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full text-left text-[11px] sm:text-sm border-collapse min-w-[550px] sm:min-w-0">
          <thead>
            <tr className="border-b border-border/50 text-muted-foreground/80 font-bold uppercase text-[9px] sm:text-xs">
              <th 
                className="py-2.5 sm:py-3 px-2 sm:px-4 cursor-pointer select-none hover:text-foreground transition-colors group/header"
                onClick={onSortDirectionChange}
              >
                <div className="flex items-center gap-1">
                  <span>Thời gian</span>
                  <ArrowUpDownIcon className="size-3 sm:size-3.5 opacity-60 group-hover/header:opacity-100 transition-opacity" />
                </div>
              </th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Thu nhập (+)</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Chi tiêu (-)</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Thu chi ròng</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Số dư lũy kế</th>
              <th className="py-2.5 sm:py-3 px-1 sm:px-3 text-center">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {isTxLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4"><Skeleton className="h-4 w-10 sm:w-12" /></td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                  <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-18 sm:w-20 ml-auto" /></td>
                  <td className="py-2.5 sm:py-3 px-1 sm:px-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
                </tr>
              ))
            ) : sortedStatsItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              sortedStatsItems.map((item) => {
                const hasTransactions = item.transactions.length > 0;
                // Tính biến động thu chi ròng của ngày/tháng
                const netChange = item.income - item.expense;
                
                return (
                  <tr
                    key={item.key}
                    onClick={() => {
                      if (hasTransactions) {
                        onSelectBucket({
                          label: filterType === 'month' ? `Giao dịch ngày ${item.label}/${year}` : `Giao dịch tháng ${item.label}/${year}`,
                          transactions: item.transactions,
                        });
                      }
                    }}
                    className={cn(
                      "transition-colors group/row",
                      hasTransactions 
                        ? "cursor-pointer hover:bg-muted/30 dark:hover:bg-muted/15" 
                        : "opacity-85"
                    )}
                  >
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-semibold text-foreground/80">
                      {item.label}
                      {hasTransactions && (
                        <Badge className="ml-1 sm:ml-2 scale-75 sm:scale-85 origin-left rounded-md bg-primary/10 border-primary/20 text-primary text-[8px] sm:text-[9px] font-bold leading-none py-0.5 px-1 sm:px-1.5">
                          {item.transactions.length} GD
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {item.income > 0 ? `+${item.income.toLocaleString('vi-VN')}₫` : '—'}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.expense > 0 ? `-${item.expense.toLocaleString('vi-VN')}₫` : '—'}
                    </td>
                    <td className={cn(
                      "py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold tabular-nums",
                      netChange > 0 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : netChange < 0 
                        ? "text-rose-600 dark:text-rose-400" 
                        : "text-muted-foreground/60"
                    )}>
                      {netChange > 0 
                        ? `+${netChange.toLocaleString('vi-VN')}₫` 
                        : netChange < 0 
                        ? `${netChange.toLocaleString('vi-VN')}₫` 
                        : '—'
                      }
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-extrabold text-foreground tabular-nums">
                      {item.balance.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center">
                      {hasTransactions ? (
                        <ChevronRightIcon className="size-3.5 sm:size-4 mx-auto text-muted-foreground/60 transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground" />
                      ) : (
                        <span className="text-muted-foreground/30 font-light">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
