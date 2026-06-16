"use client";

import { PrivatePageShell } from "@/components/private-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  CalendarCheckIcon,
  LayersIcon,
  ClockIcon,
  CheckCircle2Icon,
} from "lucide-react";

import CreateDebtDialog from "./components/create-debt-dialog";
import DebtsList from "./components/debts-list";
import { useDebtsPage } from "./hooks/use-debts-page";
import { useDraggable } from "@/hooks/use-draggable";
import { formatVnd } from "./debt-ui";

export default function DebtsPage() {
  const {
    isLoading,
    deletingId,
    fetchDebts,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    createOpen,
    setCreateOpen,
    editingDebt,
    setEditingDebt,
    filtered,
    stats,
    handleDelete,
    handleToggleStatus,
  } = useDebtsPage();

  // Hook kéo thả FAB mượt mà trên di động
  const { ref: fabRef, dragInfo, handleDragStart } = useDraggable();

  return (
    <>
      <PrivatePageShell
        title="Quản lý nợ"
        description="Ghi chú người mượn tiền, theo dõi hạn trả và tự động nhận thông báo nhắc nhở qua Telegram."
        icon={UsersIcon}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="hidden md:inline-flex rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all cursor-pointer"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon className="mr-2 size-4" />
              Ghi nhận nợ mới
            </Button>
          </div>
        }
      >
        {/* THỐNG KÊ NHANH TIỀN NỢ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-5">
          {/* Chưa trả */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 via-background to-background p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ClockIcon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng tiền chưa thu hồi</p>
                <h3 className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                  {formatVnd(stats.totalPendingAmount)}
                </h3>
              </div>
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
              <ClockIcon className="size-24" />
            </div>
          </div>

          {/* Đã trả */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-background to-background p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng tiền đã thu hồi</p>
                <h3 className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatVnd(stats.totalPaidAmount)}
                </h3>
              </div>
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
              <CheckCircle2Icon className="size-24" />
            </div>
          </div>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div className="mt-5 rounded-2xl border bg-card/60 p-4 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/45 sm:p-5 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Thanh tìm kiếm */}
            <div className="relative w-full md:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-40 transition-opacity" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên người nợ hoặc ghi chú..."
                className="h-11 rounded-xl pl-9 bg-background/50 border-input/60 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
              />
            </div>

            {/* Bộ lọc tab trạng thái */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:justify-end flex-1 w-full">
              <div className="flex w-full sm:w-auto p-1 rounded-xl bg-muted/50 border border-muted-foreground/10 gap-0.5 shadow-inner text-sm">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                    statusFilter === "all"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                  )}
                >
                  <LayersIcon className="size-3.5" />
                  <span>Tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                    statusFilter === "pending"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
                      : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5"
                  )}
                >
                  <ClockIcon className="size-3.5" />
                  <span>Chưa trả</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("paid")}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer active:scale-95",
                    statusFilter === "paid"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs"
                      : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/5"
                  )}
                >
                  <CalendarCheckIcon className="size-3.5" />
                  <span>Đã trả</span>
                </button>
              </div>

              {/* Thống kê số lượng */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto px-1">
                <span className="text-xs text-muted-foreground sm:hidden">Tổng số ghi nhận</span>
                <Badge variant="outline" className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-muted/30 border-muted-foreground/15 text-muted-foreground select-none shrink-0">
                  {isLoading ? "..." : filtered.length} bản ghi
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* DANH SÁCH NGƯỜI NỢ */}
        <div className="mt-5">
          <DebtsList
            debts={filtered}
            isLoading={isLoading}
            deletingId={deletingId}
            onClearSearch={() => setQuery("")}
            onRequestCreate={() => setCreateOpen(true)}
            onRequestEdit={(debt) => setEditingDebt(debt)}
            onRequestDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </PrivatePageShell>

      {/* Floating Action Button (FAB) trên di động */}
      <button
        ref={fabRef}
        type="button"
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleDragStart(touch.clientX, touch.clientY);
        }}
        onClick={(e) => {
          if (dragInfo.current.hasMoved) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setCreateOpen(true);
        }}
        className="fixed bottom-24 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 md:hidden border border-primary/10 hover:bg-primary/95 touch-none select-none transition-transform active:scale-95"
        aria-label="Thêm ghi nợ"
      >
        <PlusIcon className="size-6 pointer-events-none" />
      </button>

      {/* Dialog tạo/sửa */}
      <CreateDebtDialog
        open={createOpen || !!editingDebt}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingDebt(null);
          } else {
            if (!editingDebt) setCreateOpen(true);
          }
        }}
        debtId={editingDebt?.id}
        initialData={
          editingDebt
            ? {
              debtor_name: editingDebt.debtor_name,
              amount: Number(editingDebt.amount),
              borrowed_at: editingDebt.borrowed_at,
              due_at: editingDebt.due_at,
              note: editingDebt.note ?? undefined,
              status: editingDebt.status,
            }
            : undefined
        }
        onSuccess={() => {
          fetchDebts();
          setCreateOpen(false);
          setEditingDebt(null);
        }}
      />
    </>
  );
}
