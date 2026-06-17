"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CronJobHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number | null;
  jobTitle: string;
}

// Helper để dịch trạng thái của cron job
export function getStatusBadge(status: number, httpStatus: number) {
  if (status === 1) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 flex gap-1 items-center font-bold">
        <CheckCircle2 className="size-3" /> OK
      </Badge>
    );
  }

  let text = "Thất bại";
  switch (status) {
    case 2:
      text = "Lỗi DNS";
      break;
    case 3:
      text = "Không kết nối được";
      break;
    case 4:
      text = `Lỗi HTTP (${httpStatus || "N/A"})`;
      break;
    case 5:
      text = "Quá thời gian (Timeout)";
      break;
    case 6:
      text = "Quá nhiều dữ liệu";
      break;
    case 7:
      text = "URL không hợp lệ";
      break;
    case 8:
      text = "Lỗi hệ thống (cron-job)";
      break;
    case 9:
      text = "Lỗi không xác định";
      break;
    default:
      text = "Chưa chạy";
  }

  return (
    <Badge variant="outline" className="bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30 flex gap-1 items-center font-bold">
      <AlertTriangle className="size-3" /> {text}
    </Badge>
  );
}

interface CronJobHistoryItem {
  identifier?: string;
  jobLogId?: number;
  date: number;
  duration: number;
  status: number;
  code: number;
  body?: string;
  httpStatus?: number;
  url?: string;
  statusText?: string;
}

export default function CronJobHistoryDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
}: CronJobHistoryDialogProps) {
  // Fetch lịch sử chạy của job
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "cronjobs", jobId, "history"],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await fetch(`/api/admin/cronjobs/${jobId}/history`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể lấy lịch sử chạy");
      }
      return res.json();
    },
    enabled: open && !!jobId,
  });

  const history = (data?.history || []) as CronJobHistoryItem[];
  const predictions = data?.predictions || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[80vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            Lịch sử chạy: <span className="text-primary font-extrabold">{jobTitle}</span>
          </DialogTitle>
          <DialogDescription>
            Xem nhật ký thực thi gần nhất và dự kiến các lần chạy tiếp theo.
          </DialogDescription>
        </DialogHeader>

        <Separator className="opacity-40" />

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Đang tải lịch sử chạy...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive font-medium text-sm">
              {error instanceof Error ? error.message : "Đã xảy ra lỗi khi lấy lịch sử chạy"}
            </div>
          ) : (
            <>
              {/* Dự kiến lần chạy tiếp theo */}
              {predictions.length > 0 && (
                <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> Lịch chạy dự kiến tiếp theo
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {predictions.map((time: number, idx: number) => (
                      <li
                        key={`pred-${time}-${idx}`}
                        className="text-xs py-1.5 px-3 rounded-lg bg-background border border-muted/50 font-medium text-muted-foreground flex items-center gap-1.5"
                      >
                        <Clock className="size-3 text-muted-foreground/75" />
                        {format(new Date(time * 1000), "HH:mm:ss dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lịch sử chi tiết */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nhật ký các lần chạy gần đây ({history.length})
                </h4>

                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs font-medium border border-dashed rounded-2xl">
                    Chưa có lịch sử thực thi nào cho job này.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item: CronJobHistoryItem, idx: number) => {
                      const execDate = new Date(item.date * 1000);
                      const durationMs = item.duration;

                      return (
                        <div
                          key={`hist-${item.identifier || item.jobLogId || idx}-${idx}`}
                          className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl border border-muted/40 hover:border-muted-foreground/25 bg-muted/5 hover:bg-muted/15 transition-all duration-200 gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">
                                {format(execDate, "HH:mm:ss dd/MM/yyyy", { locale: vi })}
                              </span>
                              {getStatusBadge(item.status, item.httpStatus ?? 0)}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                              <span>
                                URL: <code className="text-muted-foreground/80 break-all">{item.url}</code>
                              </span>
                            </div>
                          </div>

                          <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-muted/45 gap-1 shrink-0">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" /> {durationMs} ms
                            </span>
                            {item.statusText && item.statusText !== "OK" && (
                              <span className="text-[10px] text-rose-500/80 font-bold max-w-[200px] truncate">
                                {item.statusText}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
