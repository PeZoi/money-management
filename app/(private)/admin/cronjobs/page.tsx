"use client";

import {
  Clock,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PrivatePageShell } from "@/components/private-page-shell";
import CronJobFormDialog from "./components/cronjob-form-dialog";
import CronJobHistoryDialog from "./components/cronjob-history-dialog";
import CronJobCard from "./components/cronjob-card";
import { useCronJobsPage } from "./hooks/use-cronjobs-page";

export default function AdminCronJobsPage() {
  const {
    searchTerm,
    setSearchTerm,
    formOpen,
    setFormOpen,
    historyOpen,
    setHistoryOpen,
    selectedJob,
    refetch,
    isLoading,
    isFetching,
    error,
    jobsList,
    filteredJobs,
    handleToggle,
    handleDelete,
    handleEdit,
    handleShowHistory,
    handleCreateNew,
    handleCopyUrl,
    isTogglePending,
    isDeletePending,
  } = useCronJobsPage();

  return (
    <>
      <PrivatePageShell
        title="Quản lý Cronjob Hệ thống"
        description="Theo dõi, chỉnh sửa và lập lịch các tác vụ chạy ngầm của hệ thống kết nối trực tiếp qua API cron-job.org."
        icon={Terminal}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="cursor-pointer border-border bg-card hover:bg-muted/50 rounded-xl size-10"
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button 
              onClick={handleCreateNew} 
              className="cursor-pointer font-bold rounded-xl h-10 px-4 gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              <Plus className="size-4.5" /> Tạo Cronjob
            </Button>
          </div>
        }
      >
        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="mt-5 rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/45 sm:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Thanh tìm kiếm */}
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-40 transition-opacity" />
              <Input
                placeholder="Tìm kiếm theo tên, url..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-xl pl-9 bg-background/50 border-input/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
              />
            </div>

            {/* Thống kê & Số lượng */}
            <div className="flex items-center gap-3 justify-end flex-wrap">
              {jobsList.length > 0 && (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-muted/40 border border-muted-foreground/10 text-xs font-semibold text-muted-foreground select-none">
                  <span className="px-2">Tổng số: <strong className="text-foreground">{jobsList.length}</strong></span>
                  <span className="border-l border-muted-foreground/20 pl-2 pr-2 text-emerald-600 dark:text-emerald-400">Đang chạy: <strong>{jobsList.filter((j) => j.enabled).length}</strong></span>
                  <span className="border-l border-muted-foreground/20 pl-2 pr-2 text-rose-600 dark:text-rose-400">Tạm dừng: <strong>{jobsList.filter((j) => !j.enabled).length}</strong></span>
                </div>
              )}
              
              <Badge variant="outline" className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-muted/30 border-muted-foreground/15 text-muted-foreground select-none shrink-0">
                {isLoading ? "..." : filteredJobs.length} bản ghi
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Area (Layout Grid Cards) */}
        <div className="mt-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-3xl border-rose-500/20 bg-rose-500/5 gap-3 max-w-xl mx-auto">
              <AlertTriangle className="size-10 text-rose-500 animate-bounce" />
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">Không thể tải dữ liệu Cron job</h3>
              <p className="text-xs text-center text-rose-500/90 leading-relaxed">
                {error.message || "Lỗi không xác định khi kết nối tới API. Vui lòng đảm bảo bạn đã cấu hình đúng API Key trong tệp tin .env.local."}
              </p>
              <Button
                variant="outline"
                className="mt-2 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-xl"
                onClick={() => refetch()}
              >
                Thử lại
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-3xl border-border bg-muted/5 gap-3.5">
              <Clock className="size-10 text-muted-foreground/55" />
              <h3 className="text-sm font-bold text-muted-foreground">Không tìm thấy Cronjob nào</h3>
              <p className="text-xs text-muted-foreground/80 max-w-xs text-center">
                {searchTerm ? "Không có kết quả khớp với từ khóa tìm kiếm của bạn." : "Bắt đầu bằng việc tạo cron job đầu tiên để thiết lập tự động hóa."}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew} size="sm" className="cursor-pointer font-semibold mt-1 rounded-xl">
                  <Plus className="size-3.5 mr-1" /> Tạo Cronjob ngay
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {filteredJobs.map((job) => (
                <CronJobCard
                  key={`job-${job.jobId}`}
                  job={job}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onShowHistory={handleShowHistory}
                  onCopyUrl={handleCopyUrl}
                  isTogglePending={isTogglePending}
                  isDeletePending={isDeletePending}
                />
              ))}
            </div>
          )}
        </div>
      </PrivatePageShell>

      {/* Dialogs */}
      <CronJobFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        jobToEdit={selectedJob}
      />

      <CronJobHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        jobId={selectedJob?.jobId || null}
        jobTitle={selectedJob?.title || ""}
      />
    </>
  );
}
