'use client';

import { useConfirmStore } from '@/hooks/use-confirm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConfirmDialog() {
  const { isOpen, options, onConfirm, onCancel } = useConfirmStore();

  const {
    title = 'Xác nhận hành động',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    variant = 'default',
  } = options;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent showCloseButton={false} className="max-w-md p-5 sm:p-6 gap-0">
        <DialogHeader className="p-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm',
                variant === 'destructive'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-primary/10 border-primary/20 text-primary'
              )}
            >
              <AlertTriangleIcon className="size-5 animate-bounce-slow" />
            </div>
            <DialogTitle className="text-base font-semibold leading-none">{title}</DialogTitle>
          </div>
          <DialogDescription className="mt-3 text-sm text-muted-foreground/90 sm:pl-13">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="p-0 mt-6 flex sm:flex-row justify-end gap-2 sm:pl-13">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-xs h-9 flex-1 sm:flex-initial"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            className={cn(
              'rounded-xl px-4 py-2 text-xs h-9 font-medium shadow-sm flex-1 sm:flex-initial',
              variant === 'destructive'
                ? 'bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white border border-rose-600/10'
                : ''
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
