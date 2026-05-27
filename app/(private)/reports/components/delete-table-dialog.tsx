'use client';

import { Trash2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Dialog xác nhận xóa bảng ─────────────────────────

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string | null;
  onConfirm: () => void;
}

export function DeleteTableDialog({
  open,
  onOpenChange,
  tableName,
  onConfirm,
}: DeleteTableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
        <DialogHeader className="flex flex-col items-center text-center pt-6 pb-2">
          <div className="rounded-full bg-destructive/10 p-3 mb-2 text-destructive">
            <Trash2Icon className="size-6" />
          </div>
          <DialogTitle className="text-lg font-bold">Xóa bảng báo cáo?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 px-2">
            Bảng <strong className="text-foreground">&ldquo;{tableName}&rdquo;</strong> đang chứa cấu hình dữ liệu.
            Bạn có chắc chắn muốn xóa bảng này không? Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:flex-1 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:flex-1 rounded-xl"
          >
            Xóa bảng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
