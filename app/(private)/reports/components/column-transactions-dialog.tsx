'use client';

import {
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatAmountInput, parseAmount } from '@/lib/validations/transaction-schema';
import type {
  ReportColumn,
  ReportDummyTransaction,
} from '@/types/report';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';
import { formatVnd } from '../lib/report-helpers';

// ─── Dialog hiển thị danh sách giao dịch của cột ──────

interface ColumnTransactionsDialogProps {
  column: ReportColumn | null;
  transactions: (TransactionWithCategory | ReportDummyTransaction)[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTransaction: (tx: TransactionWithCategory) => void;
  onUnassignTransaction?: (transactionId: string) => void;
  onUpdateColumn?: (updatedColumn: ReportColumn) => void;
  readOnly?: boolean;
}

export function ColumnTransactionsDialog({
  column,
  transactions,
  open,
  onOpenChange,
  onEditTransaction,
  onUnassignTransaction,
  onUpdateColumn,
  readOnly = false,
}: ColumnTransactionsDialogProps) {
  const [showDummyForm, setShowDummyForm] = useState(false);
  const [dummyNote, setDummyNote] = useState('');
  const [dummyAmount, setDummyAmount] = useState('');
  const [editingDummyId, setEditingDummyId] = useState<string | null>(null);

  if (!column) return null;

  const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const handleSaveDummy = () => {
    if (column.kind !== 'category') return;

    const parsed = parseAmount(dummyAmount);
    if (!parsed || parsed <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (parsed > 9999999999999) {
      toast.error('Số tiền quá lớn (tối đa 9,999,999,999,999đ)');
      return;
    }

    if (editingDummyId) {
      const updatedDummies = (column.dummyTransactions ?? []).map((d) =>
        d.id === editingDummyId
          ? {
            ...d,
            note: dummyNote.trim() || 'Giao dịch giả lập',
            amount: parsed,
          }
          : d
      );
      const updatedCol: ReportColumn = {
        ...column,
        dummyTransactions: updatedDummies,
      };
      onUpdateColumn?.(updatedCol);
      toast.success('Đã cập nhật giao dịch giả lập');
    } else {
      const newDummy: ReportDummyTransaction = {
        id: crypto.randomUUID(),
        note: dummyNote.trim() || 'Giao dịch giả lập',
        amount: parsed,
        type: column.categoryType,
        created_at: new Date().toISOString(),
      };
      const updatedCol: ReportColumn = {
        ...column,
        dummyTransactions: [...(column.dummyTransactions ?? []), newDummy],
      };
      onUpdateColumn?.(updatedCol);
      toast.success('Đã thêm giao dịch giả lập');
    }

    setDummyNote('');
    setDummyAmount('');
    setEditingDummyId(null);
    setShowDummyForm(false);
  };

  const handleDeleteDummy = (dummyId: string) => {
    if (column.kind !== 'category') return;

    const updatedDummies = (column.dummyTransactions ?? []).filter((d) => d.id !== dummyId);
    const updatedCol: ReportColumn = {
      ...column,
      dummyTransactions: updatedDummies,
    };
    onUpdateColumn?.(updatedCol);
    toast.success('Đã xóa giao dịch giả lập');

    if (editingDummyId === dummyId) {
      setDummyNote('');
      setDummyAmount('');
      setEditingDummyId(null);
      setShowDummyForm(false);
    }
  };

  const handleEditDummyClick = (tx: ReportDummyTransaction) => {
    setDummyNote(tx.note);
    setDummyAmount(formatAmountInput(String(tx.amount)));
    setEditingDummyId(tx.id);
    setShowDummyForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-xl focus-visible:outline-none flex flex-col max-h-[85vh]">
        <DialogHeader className="space-y-1 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary">
              <IconPreview name={column.kind === 'category' ? column.categoryIcon : 'Package'} className="size-4.5" />
            </span>
            Giao dịch cột: {column.displayName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Danh sách giao dịch thuộc cột này trong tháng được lọc.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Thống kê nhanh và Nút Toggle thêm dummy */}
          <div className="flex items-center justify-between rounded-xl bg-muted/20 p-3 text-xs shrink-0 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground font-medium">Tổng cộng ({transactions.length} giao dịch):</span>
              <span className={cn(
                "font-bold text-sm tabular-nums",
                column.kind === 'category' && column.categoryType === 'income' ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {formatVnd(totalAmount)}
              </span>
            </div>

            {column.kind === 'category' && !readOnly && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-lg text-[11px] h-8 px-2.5 font-semibold transition-all cursor-pointer",
                  showDummyForm
                    ? "bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 border-purple-500/20"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  if (showDummyForm) {
                    setDummyNote('');
                    setDummyAmount('');
                    setEditingDummyId(null);
                  }
                  setShowDummyForm(!showDummyForm);
                }}
              >
                <PlusIcon className="size-3 mr-1" />
                {showDummyForm ? 'Đóng form' : 'Giao dịch giả'}
              </Button>
            )}
          </div>

          {/* Form thêm/sửa giao dịch giả lập */}
          {column.kind === 'category' && showDummyForm && !readOnly && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-3 shrink-0 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-1.5">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {editingDummyId ? 'Sửa giao dịch giả lập' : 'Tự tạo giao dịch giả lập'}
                </span>
                <span className="text-[10px] text-muted-foreground/80 leading-none">
                  (Chỉ hiển thị tại báo cáo này)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dummy-note" className="text-[10px] font-semibold text-muted-foreground">
                    Ghi chú
                  </Label>
                  <Input
                    id="dummy-note"
                    value={dummyNote}
                    onChange={(e) => setDummyNote(e.target.value)}
                    placeholder="Ví dụ: Lương ngoài giờ, Ăn tối giả..."
                    className="h-8 text-xs rounded-lg border-purple-500/10 focus-visible:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dummy-amount" className="text-[10px] font-semibold text-muted-foreground">
                    Số tiền (VND)
                  </Label>
                  <Input
                    id="dummy-amount"
                    value={dummyAmount}
                    onChange={(e) => setDummyAmount(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="h-8 text-xs rounded-lg border-purple-500/10 focus-visible:ring-purple-500 font-semibold text-right pr-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDummy();
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDummyNote('');
                    setDummyAmount('');
                    setEditingDummyId(null);
                    setShowDummyForm(false);
                  }}
                  className="h-7 text-[10px] font-medium text-muted-foreground rounded-md hover:bg-muted cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDummy}
                  className="h-7 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-md cursor-pointer shadow-sm transition-colors"
                >
                  {editingDummyId ? 'Cập nhật' : 'Thêm vào báo cáo'}
                </Button>
              </div>
            </div>
          )}

          {/* Danh sách giao dịch */}
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex-1 flex items-center justify-center">
              Không có giao dịch nào trong cột này
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 border rounded-xl divide-y divide-border/60 bg-muted/5 pr-1">
              {transactions.map((tx) => {
                const isDummy = !('account_id' in tx);
                const isVisually = !isDummy && column.kind === 'category' && (column.transactionIds ?? []).includes(tx.id);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate block max-w-[200px]" title={tx.note || 'Không có ghi chú'}>
                          {tx.note || 'Không có ghi chú'}
                        </span>
                        {isDummy ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-none hover:bg-purple-500/15 font-semibold">
                            Giả lập
                          </Badge>
                        ) : isVisually ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-none hover:bg-blue-500/15">
                            Gán thủ công
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground border-none hover:bg-muted/80">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn(
                        "text-xs font-semibold tabular-nums",
                        tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'
                      )}>
                        {formatVnd(Number(tx.amount))}
                      </span>

                      {!readOnly && (
                        <div className="flex items-center gap-1">
                          {isDummy ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                                onClick={() => handleEditDummyClick(tx as ReportDummyTransaction)}
                                title="Sửa giao dịch giả"
                              >
                                <PencilIcon className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={() => handleDeleteDummy(tx.id)}
                                title="Xóa giao dịch giả"
                              >
                                <Trash2Icon className="size-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                                onClick={() => onEditTransaction(tx as TransactionWithCategory)}
                                title="Sửa số tiền"
                              >
                                <PencilIcon className="size-3" />
                              </Button>
                              {isVisually && onUnassignTransaction && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  onClick={() => onUnassignTransaction(tx.id)}
                                  title="Gỡ khỏi cột"
                                >
                                  <XIcon className="size-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 h-9 text-xs font-medium border-muted-foreground/20 hover:bg-accent cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
