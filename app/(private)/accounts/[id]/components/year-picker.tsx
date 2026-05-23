'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';

interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  years: number[];
}

export function YearPicker({ value, onChange, years }: YearPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Nút lùi 1 năm */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value - 1)}
        className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all"
        title="Năm trước"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Popover chọn năm */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-xl border-muted/50 font-medium text-sm flex items-center gap-2 min-w-[155px] justify-between shadow-xs bg-card/60 backdrop-blur-xs transition-all hover:bg-accent/60 hover:text-accent-foreground"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary/70" />
              <span>Năm {value}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {value === new Date().getFullYear() && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider leading-none">
                  Now
                </span>
              )}
              <ChevronRightIcon className="h-3 w-3 opacity-40 rotate-90" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[180px] p-2 rounded-2xl border shadow-xl bg-popover/95 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            {years.map((y) => {
              const isSelected = value === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(y);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-between border border-transparent cursor-pointer",
                    isSelected
                      ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/30 font-bold scale-[1.02]"
                      : "hover:bg-accent hover:border-accent-foreground/10 text-muted-foreground hover:text-foreground active:scale-95"
                  )}
                >
                  <span>Năm {y}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Nút tiến 1 năm */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all"
        title="Năm sau"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
