"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DebtRow } from "@/types/database";
import { CheckCircle2Icon, CircleIcon, Edit2Icon, InfoIcon, MessageSquareIcon, Trash2Icon } from "lucide-react";
import { formatDate, formatVnd, getDueStatus } from "../debt-ui";

type DebtsListProps = {
  debts: DebtRow[];
  isLoading: boolean;
  deletingId: string | null;
  onClearSearch: () => void;
  onRequestCreate: () => void;
  onRequestEdit: (debt: DebtRow) => void;
  onRequestDelete: (id: string) => void;
  onToggleStatus: (debt: DebtRow) => void;
};

export default function DebtsList({
  debts,
  isLoading,
  deletingId,
  onClearSearch,
  onRequestCreate,
  onRequestEdit,
  onRequestDelete,
  onToggleStatus,
}: DebtsListProps) {
  if (isLoading && debts.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-muted/65 dark:bg-muted/30" />
        ))}
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/25 p-8 text-center sm:p-12 animate-in fade-in duration-300">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <InfoIcon className="size-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-foreground">Chưa có thông tin ghi nợ nào</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Ghi lại những người đang nợ tiền bạn để dễ dàng theo dõi và nhận thông báo nhắc nhở tự động qua Telegram khi đến hạn.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl text-xs sm:text-sm"
            onClick={onClearSearch}
          >
            Xóa tìm kiếm
          </Button>
          <Button
            type="button"
            className="rounded-xl text-xs sm:text-sm font-semibold"
            onClick={onRequestCreate}
          >
            Ghi nhận nợ mới
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* GIAO DIỆN MOBILE (DẠNG CARD) */}
      <div className="grid gap-3.5 sm:grid-cols-2 md:hidden">
        {debts.map((debt) => {
          const isDeleting = deletingId === debt.id;
          const due = getDueStatus(debt.due_at, debt.status);

          return (
            <div
              key={debt.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card/75 p-4.5 shadow-xs transition-all duration-300",
                "hover:shadow-md hover:border-primary/20",
                debt.status === "paid" ? "opacity-75" : "border-border/60",
                isDeleting && "opacity-40 pointer-events-none"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-foreground truncate">{debt.debtor_name}</span>
                    <Badge className={cn("rounded-xl border px-2 py-0.5 text-[10px] font-semibold tracking-wide shadow-xs select-none", due.badgeClass)}>
                      {due.label}
                    </Badge>
                  </div>
                  <div className="mt-1 font-extrabold text-lg text-primary">
                    {formatVnd(debt.amount)}
                  </div>
                </div>

                {/* Switch Trạng thái nhanh */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus(debt)}
                  className={cn(
                    "rounded-xl font-semibold text-xs gap-1.5 h-8 shrink-0 transition-all cursor-pointer active:scale-95 border",
                    debt.status === "paid"
                      ? "bg-emerald-500/10 hover:bg-amber-500/10 text-emerald-600 hover:text-amber-600 border-emerald-500/20 hover:border-amber-500/30"
                      : "bg-amber-500/10 hover:bg-emerald-500/10 text-amber-600 hover:text-emerald-600 border-amber-500/20 hover:border-emerald-500/30"
                  )}
                >
                  {debt.status === "paid" ? (
                    <>
                      <CheckCircle2Icon className="size-3.5 fill-emerald-500/15" />
                      <span>Đã trả</span>
                    </>
                  ) : (
                    <>
                      <CircleIcon className="size-3.5" />
                      <span>Chưa trả</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Thông tin phụ */}
              <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                <div className="flex justify-between">
                  <span>Ngày mượn:</span>
                  <span className="font-semibold text-foreground">{formatDate(debt.borrowed_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hạn trả nợ:</span>
                  <span className={cn("font-semibold", due.textClass)}>{formatDate(debt.due_at)}</span>
                </div>
                {debt.note && (
                  <div className="flex items-start gap-1.5 mt-2 bg-muted/30 p-2 rounded-lg text-[11px] leading-relaxed italic border border-border/30">
                    <MessageSquareIcon className="size-3.5 shrink-0 text-muted-foreground/60 mt-0.5" />
                    <span className="text-muted-foreground/80 wrap-break-word">{debt.note}</span>
                  </div>
                )}
              </div>

              {/* Nút hành động */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/40 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRequestEdit(debt)}
                  className="rounded-xl h-8 text-[11px] gap-1 px-3"
                >
                  <Edit2Icon className="size-3.5" />
                  <span>Sửa</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRequestDelete(debt.id)}
                  className="rounded-xl h-8 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1 px-3"
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Xóa</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* GIAO DIỆN DESKTOP (DẠNG BẢNG) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border bg-card/65 shadow-xs backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
              <TableHead className="font-bold py-3.5 pl-6 w-[18%]">Người nợ</TableHead>
              <TableHead className="font-bold py-3.5 text-right w-[14%]">Số tiền</TableHead>
              <TableHead className="font-bold py-3.5 text-center w-[10%]">Ngày mượn</TableHead>
              <TableHead className="font-bold py-3.5 text-center w-[10%]">Hạn trả nợ</TableHead>
              <TableHead className="font-bold py-3.5 text-center w-[13%]">Trạng thái</TableHead>
              <TableHead className="font-bold py-3.5 text-center w-[13%]">Đã trả</TableHead>
              <TableHead className="font-bold py-3.5 w-[12%]">Ghi chú</TableHead>
              <TableHead className="font-bold py-3.5 text-right pr-6 w-[10%]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((debt) => {
              const isDeleting = deletingId === debt.id;
              const due = getDueStatus(debt.due_at, debt.status);

              return (
                <TableRow
                  key={debt.id}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-muted/10",
                    debt.status === "paid" && "opacity-75 bg-muted/5",
                    isDeleting && "opacity-40 pointer-events-none"
                  )}
                >
                  {/* Người nợ */}
                  <TableCell className="py-4 pl-6 font-bold text-foreground">
                    {debt.debtor_name}
                  </TableCell>

                  {/* Số tiền */}
                  <TableCell className="py-4 text-right font-extrabold text-primary">
                    {formatVnd(debt.amount)}
                  </TableCell>

                  {/* Ngày mượn */}
                  <TableCell className="py-4 text-center text-muted-foreground text-xs font-semibold">
                    {formatDate(debt.borrowed_at)}
                  </TableCell>

                  {/* Hạn trả */}
                  <TableCell className="py-4 text-center text-xs font-bold">
                    <span className={due.textClass}>{formatDate(debt.due_at)}</span>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell className="py-4 text-center">
                    <Badge className={cn("rounded-xl border px-2.5 py-0.5 text-[10px] font-bold tracking-wide shadow-xs select-none", due.badgeClass)}>
                      {due.label}
                    </Badge>
                  </TableCell>

                  {/* Đã trả */}
                  <TableCell className="py-4 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleStatus(debt)}
                      className={cn(
                        "mx-auto flex rounded-xl font-semibold text-xs gap-1.5 h-8 transition-all cursor-pointer active:scale-95 border",
                        debt.status === "paid"
                          ? "bg-emerald-500/10 hover:bg-amber-500/10 text-emerald-600 hover:text-amber-600 border-emerald-500/20 hover:border-amber-500/30"
                          : "bg-amber-500/10 hover:bg-emerald-500/10 text-amber-600 hover:text-emerald-600 border-amber-500/20 hover:border-emerald-500/30"
                      )}
                    >
                      {debt.status === "paid" ? (
                        <>
                          <CheckCircle2Icon className="size-3.5 fill-emerald-500/15" />
                          <span>Đã trả</span>
                        </>
                      ) : (
                        <>
                          <CircleIcon className="size-3.5" />
                          <span>Chưa trả</span>
                        </>
                      )}
                    </Button>
                  </TableCell>

                  {/* Ghi chú */}
                  <TableCell className="py-4 text-muted-foreground text-xs max-w-[150px] truncate" title={debt.note ?? ""}>
                    {debt.note || "-"}
                  </TableCell>

                  {/* Thao tác */}
                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRequestEdit(debt)}
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2Icon className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRequestDelete(debt.id)}
                        className="size-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
