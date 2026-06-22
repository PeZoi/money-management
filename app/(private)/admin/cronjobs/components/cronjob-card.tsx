"use client";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Settings,
  Trash2,
  ListRestart,
  ExternalLink,
  Copy,
  Terminal,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatusBadge } from "./cronjob-history-dialog";
import { CronJob, CronJobSchedule } from "../types";

// Phương thức HTTP map
function getMethodBadge(method: number) {
  const methods = ["GET", "POST", "OPTIONS", "HEAD", "PUT", "DELETE", "TRACE", "CONNECT", "PATCH"];
  const name = methods[method] || "GET";
  
  let color = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/30";
  if (name === "POST") color = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30";
  if (name === "PUT" || name === "PATCH") color = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30";
  if (name === "DELETE") color = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30";

  return (
    <Badge variant="outline" className={`${color} font-bold text-[10px] px-1.5 py-0`}>
      {name}
    </Badge>
  );
}

// Helper để format hiển thị Tần suất chạy tiếng Việt
function formatSchedule(schedule: CronJobSchedule | null | undefined): string {
  if (!schedule) return "N/A";
  const minutes = schedule.minutes || [];
  const hours = schedule.hours || [];

  if (minutes.includes(-1)) {
    return "Mỗi phút";
  }
  if (minutes.length === 12) {
    return "Mỗi 5 phút";
  }
  if (minutes.length === 4) {
    return "Mỗi 15 phút";
  }
  if (minutes.length === 2) {
    return "Mỗi 30 phút";
  }
  if (minutes.length === 1 && minutes[0] === 0) {
    if (hours.includes(-1)) {
      return "Mỗi giờ";
    }
    return `Mỗi ngày lúc ${String(hours[0]).padStart(2, "0")}:00`;
  }

  return "Tùy chỉnh";
}

interface CronJobCardProps {
  job: CronJob;
  onToggle: (jobId: number, currentStatus: boolean) => void;
  onDelete: (jobId: number, title: string) => void;
  onEdit: (job: CronJob) => void;
  onShowHistory: (job: CronJob) => void;
  onCopyUrl: (url: string) => void;
  onRunJob: (jobId: number) => void;
  isTogglePending: boolean;
  isDeletePending: boolean;
  isRunPending: boolean;
}

export default function CronJobCard({
  job,
  onToggle,
  onDelete,
  onEdit,
  onShowHistory,
  onCopyUrl,
  onRunJob,
  isTogglePending,
  isDeletePending,
  isRunPending,
}: CronJobCardProps) {
  const lastExecDate = job.lastExecution > 0 ? new Date(job.lastExecution * 1000) : null;
  const nextExecDate = job.nextExecution > 0 ? new Date(job.nextExecution * 1000) : null;

  return (
    <div
      className="relative group flex flex-col justify-between p-5 rounded-2xl border border-border/80 hover:border-primary/50 bg-card hover:bg-muted/10 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300 gap-4"
    >
      {/* Header Card */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Terminal className="size-5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="font-extrabold text-foreground tracking-tight text-sm sm:text-base truncate group-hover:text-primary transition-colors duration-200">
              {job.title || "Chưa đặt tên"}
            </h3>
            <div className="flex items-center gap-2">
              {getMethodBadge(job.requestMethod)}
              <span className="text-[10px] font-extrabold text-muted-foreground/80 tracking-wider uppercase">
                {formatSchedule(job.schedule)}
              </span>
            </div>
          </div>
        </div>

        {/* Switch Toggle */}
        <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={job.enabled}
            disabled={isTogglePending}
            onChange={() => onToggle(job.jobId, job.enabled)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 transition-colors duration-200"></div>
        </label>
      </div>

      {/* Body Card */}
      <div className="space-y-4 flex-1">
        {/* API Link */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 dark:bg-muted/15 border border-border/50">
          <span className="text-xs font-mono truncate text-foreground/85 dark:text-foreground/75 font-medium max-w-[190px] sm:max-w-[230px]">
            {job.url}
          </span>
          <div className="flex items-center gap-1 shrink-0 pl-2">
            <button
              onClick={() => onCopyUrl(job.url)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Sao chép URL"
            >
              <Copy className="size-3.5" />
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all"
              title="Mở liên kết"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        <Separator className="opacity-40" />

        {/* Chi tiết lịch chạy */}
        <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/75 block">
              Chạy gần nhất
            </span>
            <div className="text-xs sm:text-sm font-bold text-foreground">
              {lastExecDate ? (
                <div className="flex flex-col gap-1">
                  <span className="text-foreground/90">{format(lastExecDate, "HH:mm dd/MM", { locale: vi })}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 w-fit">
                    {job.lastDuration}ms
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground/60 font-medium">Chưa chạy</span>
              )}
            </div>
          </div>

          <div className="space-y-1 border-l pl-3.5 border-border/80">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/75 block">
              Chạy tiếp theo
            </span>
            <div className="text-xs sm:text-sm font-bold text-foreground">
              {job.enabled && nextExecDate ? (
                <span className="text-foreground/90">{format(nextExecDate, "HH:mm dd/MM", { locale: vi })}</span>
              ) : job.enabled ? (
                <span className="text-amber-500 animate-pulse font-medium">Chờ lịch...</span>
              ) : (
                <span className="text-rose-500/80 font-bold">Đã tạm dừng</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Card */}
      <div className="flex items-center justify-between pt-3 border-t border-border/80 gap-2 shrink-0">
        <div>
          {getStatusBadge(job.lastStatus, job.lastStatus === 4 ? 400 : 200)}
        </div>

        <div className="flex items-center gap-1">
          {/* Chạy thử ngay */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRunJob(job.jobId)}
            disabled={isRunPending}
            className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer active:scale-95 transition-all"
            title="Chạy thử ngay"
          >
            {isRunPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
          </Button>
          {/* Xem Lịch sử */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShowHistory(job)}
            className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer active:scale-95 transition-all"
            title="Lịch sử thực thi"
          >
            <ListRestart className="size-4" />
          </Button>
          {/* Cấu hình */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(job)}
            className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer active:scale-95 transition-all"
            title="Cấu hình"
          >
            <Settings className="size-4" />
          </Button>
          {/* Xóa */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(job.jobId, job.title)}
            disabled={isDeletePending}
            className="h-8.5 w-8.5 rounded-xl text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer active:scale-95 transition-all"
            title="Xóa job"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
