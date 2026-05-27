'use client';

import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatAmountInput, parseAmount } from '@/lib/validations/transaction-schema';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';

// ─── Dialog chỉnh sửa số tiền giao dịch ──────────────

interface EditAmountDialogProps {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  tableId: string;
  columnId: string | null;
  isAssignedVisually: boolean;
  onUnassignTransaction?: (tableId: string, columnId: string, transactionId: string) => void;
}

export function EditAmountDialog({
  transaction,
  open,
  onOpenChange,
  month,
  tableId,
  columnId,
  isAssignedVisually,
  onUnassignTransaction,
}: EditAmountDialogProps) {
  const [amount, setAmount] = useState(() =>
    transaction ? formatAmountInput(String(transaction.amount)) : ''
  );
  const { updateTransaction, isSubmitting } = useTransactionMutation();
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const handleChangeAmount = (val: string) => {
    setAmount(formatAmountInput(val));
  };

  const handleSave = async () => {
    if (!transaction) return;
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (parsedAmount > 9999999999999) {
      toast.error('Số tiền quá lớn (tối đa 9,999,999,999,999đ)');
      return;
    }

    const success = await updateTransaction(transaction.id, {
      amount: parsedAmount,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      note: transaction.note,
      created_at: transaction.created_at,
    });

    if (success) {
      // Invalidate cache giao dịch báo cáo để cập nhật giá tiền trên bảng ngay lập tức
      queryClient.invalidateQueries({
        queryKey: ['report-transactions', activeWorkspaceId, month],
      });
      onOpenChange(false);
    }
  };

  // Gỡ giao dịch khỏi cột danh mục (visually)
  const handleRemoveFromColumn = () => {
    if (!transaction || !tableId || !columnId) return;

    if (onUnassignTransaction) {
      onUnassignTransaction(tableId, columnId, transaction.id);
      toast.success('Đã gỡ giao dịch khỏi cột danh mục');
      onOpenChange(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl focus-visible:outline-none">
        <DialogHeader className="space-y-1 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex items-center justify-center size-8 rounded-xl bg-emerald-500/10 text-emerald-600">
              <IconPreview name={transaction.category?.icon} className="size-4.5" />
            </span>
            Sửa số tiền giao dịch
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thay đổi số tiền của giao dịch trực tiếp từ bảng báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border bg-muted/20 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Giao dịch:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{transaction.note || 'Không có ghi chú'}</span>
            </div>
            <div className="flex justify-between">
              <span>Danh mục:</span>
              <span className="font-medium text-foreground">{transaction.category?.name || 'Chưa phân loại'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày tạo:</span>
              <span className="font-mono text-foreground">
                {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount" className="text-xs font-semibold text-muted-foreground">
              Số tiền mới (VND)
            </Label>
            <Input
              id="edit-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleChangeAmount(e.target.value)}
              placeholder="0"
              className="rounded-lg h-10 text-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary font-semibold text-right pr-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {/* Nút Gỡ khỏi cột chỉ hiện khi giao dịch được gán visually */}
          {isAssignedVisually && (
            <Button
              variant="ghost"
              type="button"
              onClick={handleRemoveFromColumn}
              className="mr-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg h-9 px-3 cursor-pointer"
              disabled={isSubmitting}
            >
              <Trash2Icon className="size-3.5 mr-1" />
              Gỡ khỏi cột
            </Button>
          )}

          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 h-9 text-xs font-medium border-muted-foreground/20 hover:bg-accent cursor-pointer"
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-lg px-4 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
