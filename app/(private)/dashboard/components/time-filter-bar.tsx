'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MonthPicker } from '@/components/month-picker';
import { YearPicker } from '@/app/(private)/accounts/[id]/components/year-picker';

interface TimeFilterBarProps {
  timeRange: 'week' | 'month' | 'year' | 'all';
  setTimeRange: (range: 'week' | 'month' | 'year' | 'all') => void;
  referenceDate: Date;
  setReferenceDate: React.Dispatch<React.SetStateAction<Date>>;
  periodLabel: string;
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
}

export function TimeFilterBar({
  timeRange,
  setTimeRange,
  referenceDate,
  setReferenceDate,
  periodLabel,
  onPrevPeriod,
  onNextPeriod,
}: TimeFilterBarProps) {
  // Tạo mảng năm cho YearPicker
  const yearsArray = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Tạo danh sách 10 năm từ 5 năm trước đến 4 năm sau
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  }, []);

  // Định dạng value YYYY-MM cho MonthPicker
  const monthValue = React.useMemo(() => {
    const y = referenceDate.getFullYear();
    const m = String(referenceDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [referenceDate]);

  // Xử lý khi thay đổi MonthPicker
  const handleMonthChange = (val: string) => {
    if (val === 'all') {
      setTimeRange('all');
      setReferenceDate(new Date());
      return;
    }
    const [y, m] = val.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m)) {
      setReferenceDate(new Date(y, m - 1, 1));
    }
  };

  // Xử lý khi thay đổi YearPicker
  const handleYearChange = (yearVal: number) => {
    setReferenceDate(new Date(yearVal, referenceDate.getMonth(), 1));
  };

  return (
    <div className="sticky top-[calc(env(safe-area-inset-top)+0.5rem)] sm:top-[calc(env(safe-area-inset-top)+1rem)] z-30 mt-5 space-y-4 rounded-3xl border bg-card/80 p-4 sm:p-5 shadow-sm backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        
        {/* Segmented Control cho timeRange (Đồng bộ style và có điểm nhấn primary khi active) */}
        <div className="flex p-1 rounded-xl bg-muted/60 border gap-0.5 w-full max-w-sm sm:w-auto shadow-inner">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => {
                setTimeRange(range);
                setReferenceDate(new Date());
              }}
              className={cn(
                'flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 text-center',
                timeRange === range
                  ? 'bg-background text-primary border-primary/5 border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range === 'week' ? 'Tuần' : range === 'month' ? 'Tháng' : range === 'year' ? 'Năm' : 'Tất cả'}
            </button>
          ))}
        </div>

        {/* Điều hướng thời gian với picker calendar tương ứng */}
        {timeRange !== 'all' && (
          <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            {timeRange === 'week' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onPrevPeriod}
                  className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 sm:flex-none h-10 px-4 flex items-center justify-center bg-primary/5 border border-primary/10 rounded-xl min-w-[155px] shadow-xs select-none">
                  <span className="font-extrabold text-[11px] sm:text-xs tracking-wider text-primary text-center whitespace-nowrap">
                    {periodLabel}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onNextPeriod}
                  className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 active:scale-95 transition-all shadow-xs shrink-0"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </>
            ) : timeRange === 'month' ? (
              <MonthPicker 
                value={monthValue} 
                onChange={handleMonthChange}
              />
            ) : (
              <YearPicker 
                value={referenceDate.getFullYear()} 
                onChange={handleYearChange}
                years={yearsArray}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
