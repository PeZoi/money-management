'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Clock, Calendar as CalendarIcon, Edit3 } from 'lucide-react';
import type { LoveTheme } from '../constants';

interface LiveLoveTimerProps {
  anniversaryDate: string;
  theme: LoveTheme;
  isCustomBg: boolean;
  onEditAnniversary: () => void;
}

/**
 * Component hiển thị thời gian yêu nhau (Ngày, Giờ, Phút, Giây) theo thời gian thực.
 * Tách biệt việc đếm 1s/lần vào component này để tránh re-render thẻ HeartbeatCard cha.
 */
export const LiveLoveTimer = React.memo(function LiveLoveTimer({
  anniversaryDate,
  theme,
  isCustomBg,
  onEditAnniversary,
}: LiveLoveTimerProps) {
  const [timePassed, setTimePassed] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    if (!anniversaryDate) return;

    const calculateTime = () => {
      const annivDate = new Date(anniversaryDate);
      annivDate.setHours(0, 0, 0, 0);

      const now = new Date();
      const diffMs = now.getTime() - annivDate.getTime();

      if (diffMs < 0) {
        setTimePassed({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimePassed({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [anniversaryDate]);

  return (
    <div className="space-y-3 mt-4">
      <span
        className={cn(
          "text-xs font-semibold tracking-widest uppercase px-3.5 py-1.5 rounded-full border",
          isCustomBg
            ? "text-white/80 bg-white/10 border-white/10"
            : `${theme.text} ${theme.bgLight} ${theme.border}`
        )}
      >
        Ngày yêu nhau
      </span>

      {/* Khối đếm số ngày */}
      <div className="mt-3">
        <h1
          className={cn(
            "text-4xl md:text-6xl font-black tracking-tight select-none",
            isCustomBg
              ? `bg-gradient-to-r ${theme.dayGradient} bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]`
              : `bg-gradient-to-r ${theme.dayGradient} bg-clip-text text-transparent`
          )}
        >
          {timePassed.days.toLocaleString('vi-VN')}{' '}
          <span className={cn("text-xl md:text-3xl font-bold", isCustomBg ? "text-white" : "text-foreground")}>
            ngày
          </span>
        </h1>
      </div>

      {/* Đếm chi tiết giờ phút giây */}
      <div
        className={cn(
          "flex justify-center items-center gap-2.5 text-xs md:text-sm font-bold p-2 md:p-2.5 rounded-xl border max-w-sm mx-auto shadow-inner select-none whitespace-nowrap",
          isCustomBg
            ? "text-slate-200 bg-black/45 border-white/10 backdrop-blur-[1px]"
            : "text-muted-foreground bg-background/50 dark:bg-background/20 border"
        )}
      >
        <Clock className={cn("size-4 shrink-0", isCustomBg ? theme.textOnBg : theme.textRoseColor)} />
        <div className="flex items-center gap-0.5">
          <span className="tabular-nums min-w-[18px] text-center">{timePassed.hours.toString().padStart(2, '0')}</span>
          <span>giờ</span>
        </div>
        <span className="text-muted-foreground/30 dark:text-muted-foreground/20">:</span>
        <div className="flex items-center gap-0.5">
          <span className="tabular-nums min-w-[18px] text-center">{timePassed.minutes.toString().padStart(2, '0')}</span>
          <span>phút</span>
        </div>
        <span className="text-muted-foreground/30 dark:text-muted-foreground/20">:</span>
        <div className={cn("flex items-center gap-0.5", isCustomBg ? theme.textOnBg : theme.textRoseColor)}>
          <span className="tabular-nums min-w-[18px] text-center font-extrabold">
            {timePassed.seconds.toString().padStart(2, '0')}
          </span>
          <span>giây</span>
        </div>
      </div>

      {/* Ngày kỷ niệm */}
      <div
        className={cn(
          "flex justify-center items-center gap-2 text-xs md:text-sm pt-2",
          isCustomBg ? "text-slate-300" : "text-muted-foreground"
        )}
      >
        <CalendarIcon className="size-4" />
        <span>
          Bắt đầu từ:{' '}
          <strong className={isCustomBg ? "text-white" : "text-foreground"}>
            {new Date(anniversaryDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </strong>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditAnniversary}
          className={cn(
            "size-7 rounded-full cursor-pointer ml-1",
            isCustomBg
              ? `hover:bg-white/10 text-white/70 hover:${theme.textOnBg}`
              : `hover:bg-muted text-muted-foreground hover:${theme.text}`
          )}
          title="Thay đổi ngày kỷ niệm"
        >
          <Edit3 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
});
