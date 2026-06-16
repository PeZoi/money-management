"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, Trash2Icon, UserIcon, CalendarIcon, DollarSignIcon } from "lucide-react";
import { formatAmountInput } from "@/lib/validations/transaction-schema";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useDebtForm, useDebtMutation } from "@/hooks/use-debts";
import { useConfirm } from "@/hooks/use-confirm";

type CreateDebtDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtId?: string;
  initialData?: {
    debtor_name: string;
    amount: number;
    borrowed_at: string;
    due_at: string;
    note?: string;
    status?: "pending" | "paid";
  };
  workspaceId?: string;
  onSuccess?: () => void;
};

export default function CreateDebtDialog({
  open,
  onOpenChange,
  debtId,
  initialData,
  workspaceId,
  onSuccess,
}: CreateDebtDialogProps) {
  const { form, isSubmitting, isUpdate, handleSubmit } = useDebtForm({
    open,
    onOpenChange,
    debtId,
    initialData,
    workspaceId,
    onSuccess,
  });

  const { deleteDebt, isSubmitting: isDeleting } = useDebtMutation();
  const confirm = useConfirm();

  const [openBorrowedCalendar, setOpenBorrowedCalendar] = useState(false);
  const [openDueCalendar, setOpenDueCalendar] = useState(false);

  const handleDeleteClick = async () => {
    if (!debtId) return;
    const confirmed = await confirm({
      title: "Xóa khoản nợ",
      message: "Bạn có chắc chắn muốn xóa thông tin ghi nhận nợ này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!confirmed) return;
    await deleteDebt(debtId, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const isLoading = isSubmitting || isDeleting;

  // Lấy giá trị và lỗi từ react-hook-form
  const debtorName = form.watch("debtor_name");
  const amount = form.watch("amount");
  const borrowedAt = form.watch("borrowed_at");
  const dueAt = form.watch("due_at");

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} fullScreenOnMobile className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b px-5 py-4 sm:px-6">
          <DialogTitle>{isUpdate ? "Cập nhật thông tin nợ" : "Ghi nhận người nợ mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5">
            {/* Tên người nợ */}
            <div className="grid gap-2">
              <Label htmlFor="debtor_name">Tên người nợ</Label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                <Input
                  id="debtor_name"
                  {...form.register("debtor_name")}
                  placeholder="Ví dụ: Nguyễn Văn A, Anh Hoàng..."
                  className="h-11 rounded-xl pl-9"
                  disabled={isLoading}
                />
              </div>
              {errors.debtor_name && (
                <p className="text-xs text-rose-500 font-medium">{errors.debtor_name.message}</p>
              )}
            </div>

            {/* Số tiền nợ */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền nợ (VND)</Label>
              <div className="relative">
                <DollarSignIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => form.setValue("amount", formatAmountInput(e.target.value), { shouldValidate: true })}
                  placeholder="Nhập số tiền mượn..."
                  className="h-11 rounded-xl pl-9 font-bold text-lg text-foreground"
                  disabled={isLoading}
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-500 font-medium">{errors.amount.message}</p>
              )}
            </div>

            {/* Ngày mượn và Ngày hẹn trả */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ngày mượn tiền */}
              <div className="grid gap-2">
                <Label htmlFor="borrowed_at">Ngày mượn tiền</Label>
                <Popover open={openBorrowedCalendar} onOpenChange={setOpenBorrowedCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      id="borrowed_at"
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 justify-start text-left font-normal rounded-xl border-border bg-card pl-9 relative w-full cursor-pointer",
                        !borrowedAt && "text-muted-foreground",
                        errors.borrowed_at && "border-destructive text-destructive"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      {borrowedAt ? format(new Date(borrowedAt), "dd/MM/yyyy") : <span>Chọn ngày mượn</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={borrowedAt ? new Date(borrowedAt) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, "0");
                          const dd = String(date.getDate()).padStart(2, "0");
                          form.setValue("borrowed_at", `${yyyy}-${mm}-${dd}`, { shouldValidate: true });
                          setOpenBorrowedCalendar(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {errors.borrowed_at && (
                  <p className="text-xs text-rose-500 font-medium">{errors.borrowed_at.message}</p>
                )}
              </div>

              {/* Ngày hẹn trả tiền */}
              <div className="grid gap-2">
                <Label htmlFor="due_at">Ngày hẹn trả tiền</Label>
                <Popover open={openDueCalendar} onOpenChange={setOpenDueCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      id="due_at"
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 justify-start text-left font-normal rounded-xl border-border bg-card pl-9 relative w-full cursor-pointer",
                        !dueAt && "text-muted-foreground",
                        errors.due_at && "border-destructive text-destructive"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      {dueAt ? format(new Date(dueAt), "dd/MM/yyyy") : <span>Chọn ngày hẹn trả</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueAt ? new Date(dueAt) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const yyyy = date.getFullYear();
                          const mm = String(date.getMonth() + 1).padStart(2, "0");
                          const dd = String(date.getDate()).padStart(2, "0");
                          form.setValue("due_at", `${yyyy}-${mm}-${dd}`, { shouldValidate: true });
                          setOpenDueCalendar(false);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {errors.due_at && (
                  <p className="text-xs text-rose-500 font-medium">{errors.due_at.message}</p>
                )}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú thêm</Label>
              <Textarea
                id="note"
                {...form.register("note")}
                placeholder="Ghi chú chi tiết về khoản nợ này (ví dụ: mượn mua điện thoại, hẹn trả qua chuyển khoản...)"
                className="min-h-[80px] rounded-xl resize-none"
                disabled={isLoading}
              />
              {errors.note && (
                <p className="text-xs text-rose-500 font-medium">{errors.note.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Footer buttons */}
          <div className="border-t px-5 pt-4 pb-8 sm:py-4 sm:px-6 bg-muted/10 shrink-0 flex flex-row items-center justify-between gap-3">
            {isUpdate ? (
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-semibold cursor-pointer active:scale-95 transition-all text-xs sm:text-sm px-3 gap-1.5 h-9 sm:h-10"
                onClick={handleDeleteClick}
                disabled={isLoading}
              >
                {isDeleting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="size-4" />
                )}
                {isDeleting ? "Đang xóa..." : "Xóa ghi nợ"}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-xs sm:text-sm h-9 sm:h-10"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 cursor-pointer active:scale-95 transition-all font-semibold"
                disabled={isLoading || !debtorName || !amount}
              >
                {isLoading && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                {isUpdate ? "Lưu thay đổi" : "Lưu ghi nợ"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
