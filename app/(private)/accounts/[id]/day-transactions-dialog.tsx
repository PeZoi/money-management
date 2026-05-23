'use client';

import type { TransactionWithCategory } from '@/types/database';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReceiptTextIcon } from 'lucide-react';
import TransactionsList from '@/app/(private)/transactions/components/transactions-list';

type DayTransactionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  transactions: TransactionWithCategory[];
  onUpdate: (transaction: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
};

export default function DayTransactionsDialog({
  open,
  onOpenChange,
  title,
  transactions,
  onUpdate,
  onDelete,
}: DayTransactionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="border-b px-5 py-4 sm:px-6 shrink-0">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ReceiptTextIcon className="size-4.5" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Danh sách giao dịch phát sinh chi tiết
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 overflow-y-auto flex-1">
          <TransactionsList
            transactions={transactions}
            isLoading={false}
            onRequestCreate={() => {}} // Popup phân tích chỉ xem và quản lý giao dịch có sẵn
            onRequestDelete={(id) => {
              onOpenChange(false);
              onDelete(id);
            }}
            onRequestUpdate={(t) => {
              onOpenChange(false);
              onUpdate(t);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
