"use client";

import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthPickerProps {
  value: string; // "YYYY-MM" hoặc "all"
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  { value: 1, label: "Thg 1" },
  { value: 2, label: "Thg 2" },
  { value: 3, label: "Thg 3" },
  { value: 4, label: "Thg 4" },
  { value: 5, label: "Thg 5" },
  { value: 6, label: "Thg 6" },
  { value: 7, label: "Thg 7" },
  { value: 8, label: "Thg 8" },
  { value: 9, label: "Thg 9" },
  { value: 10, label: "Thg 10" },
  { value: 11, label: "Thg 11" },
  { value: 12, label: "Thg 12" },
];

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Lấy năm hiện hành từ value, hoặc mặc định năm nay
  const [currentYear, setCurrentYear] = React.useState(() => {
    if (value && value !== "all") {
      const [y] = value.split("-").map(Number);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  // Đồng bộ currentYear khi value thay đổi
  React.useEffect(() => {
    if (value && value !== "all") {
      const [y] = value.split("-").map(Number);
      if (!isNaN(y)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentYear(y);
      }
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (value === "all") {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      onChange(`${y}-${m}`);
      return;
    }

    const [y, m] = value.split("-").map(Number);
    if (m === 1) {
      onChange(`${y - 1}-12`);
    } else {
      const prevMonth = String(m - 1).padStart(2, "0");
      onChange(`${y}-${prevMonth}`);
    }
  };

  const handleNextMonth = () => {
    if (value === "all") {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      onChange(`${y}-${m}`);
      return;
    }

    const [y, m] = value.split("-").map(Number);
    if (m === 12) {
      onChange(`${y + 1}-01`);
    } else {
      const nextMonth = String(m + 1).padStart(2, "0");
      onChange(`${y}-${nextMonth}`);
    }
  };

  const handleYearPrev = () => {
    setCurrentYear((prev) => prev - 1);
  };

  const handleYearNext = () => {
    setCurrentYear((prev) => prev + 1);
  };

  const handleMonthSelect = (monthVal: number) => {
    const mStr = String(monthVal).padStart(2, "0");
    onChange(`${currentYear}-${mStr}`);
    setOpen(false);
  };

  const selectThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    onChange(`${y}-${m}`);
    setOpen(false);
  };

  const selectAll = () => {
    onChange("all");
    setOpen(false);
  };

  // Trình bày nhãn hiển thị của bộ lọc
  const displayLabel = React.useMemo(() => {
    if (value === "all") {
      return "Tất cả thời gian";
    }
    const [y, m] = value.split("-").map(Number);
    if (isNaN(y) || isNaN(m)) return "Chọn tháng";
    return `Tháng ${String(m).padStart(2, "0")}, ${y}`;
  }, [value]);

  const isCurrentMonthSelected = React.useMemo(() => {
    if (value === "all") return false;
    const now = new Date();
    const currentStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return value === currentStr;
  }, [value]);

  const selectedMonthNum = React.useMemo(() => {
    if (value === "all") return null;
    const [y, m] = value.split("-").map(Number);
    if (y === currentYear) return m;
    return null;
  }, [value, currentYear]);

  // Tháng thực tế của hôm nay (để hiển thị dấu hiệu "tháng hiện tại")
  const today = React.useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const isTodayYear = currentYear === today.year;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Nút lùi 1 tháng */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        className="h-10 w-9 sm:w-10 shrink-0 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all animate-in fade-in zoom-in duration-300"
        title="Tháng trước"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Popover chọn tháng */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 px-2 sm:px-4 rounded-xl border-muted/50 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 min-w-[125px] sm:min-w-[155px] justify-between shadow-xs bg-card/60 backdrop-blur-xs transition-all hover:bg-accent/60 hover:text-accent-foreground",
              value === "all" && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isCurrentMonthSelected && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] sm:text-[9px] font-bold uppercase tracking-wider leading-none scale-90 sm:scale-100">
                  Now
                </span>
              )}
              <ChevronRightIcon className="h-3 w-3 opacity-40 rotate-90" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[280px] p-4 rounded-2xl border shadow-xl bg-popover/95 backdrop-blur-md">
          {/* Header chọn năm */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleYearPrev}
              className="h-8 w-8 rounded-lg hover:bg-accent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm tracking-wide text-foreground/90">
              Năm {currentYear}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleYearNext}
              className="h-8 w-8 rounded-lg hover:bg-accent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid 12 tháng */}
          <div className="grid grid-cols-3 gap-2 py-4">
            {MONTHS.map((m) => {
              const isSelected = selectedMonthNum === m.value;
              // Ô tháng hiện tại của hệ thống (không phụ thuộc vào isSelected)
              const isToday = isTodayYear && today.month === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleMonthSelect(m.value)}
                  className={cn(
                    "h-10 text-xs font-medium rounded-xl transition-all duration-200 relative flex flex-col items-center justify-center gap-0.5 border",
                    isSelected
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/30 font-bold scale-[1.08] border-primary/20 ring-2 ring-primary/30 ring-offset-1 ring-offset-popover"
                      : isToday
                        ? "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 hover:scale-[1.03] active:scale-95"
                        : "border-transparent hover:bg-accent hover:border-accent-foreground/10 text-muted-foreground hover:text-foreground active:scale-95"
                  )}
                >
                  <span>{m.label}</span>
                  {/* Dot chấm nhỏ: primary-foreground khi selected, primary khi là tháng hiện tại */}
                  {(isSelected || isToday) && (
                    <span
                      className={cn(
                        "size-1 rounded-full shrink-0",
                        isSelected ? "bg-primary-foreground/70" : "bg-primary animate-pulse"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer nút hành động nhanh */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectThisMonth}
              className={cn(
                "rounded-xl h-9 text-xs flex items-center justify-center gap-1.5 border-muted/50 hover:bg-accent/80",
                isCurrentMonthSelected && "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
              )}
            >
              <ClockIcon className="h-3.5 w-3.5" />
              Tháng này
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              className={cn(
                "rounded-xl h-9 text-xs flex items-center justify-center gap-1.5 border-muted/50 hover:bg-accent/80",
                value === "all" && "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
              )}
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Tất cả
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Nút tiến 1 tháng */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-10 w-9 sm:w-10 shrink-0 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all animate-in fade-in zoom-in duration-300"
        title="Tháng sau"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
