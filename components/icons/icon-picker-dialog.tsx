'use client';

import { createElement, useCallback, useMemo, useState } from 'react';

import IconPicker, { getLucideIconComponent } from '@/components/icons/icon-picker';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ShapesIcon } from 'lucide-react';

type Props = {
  value?: string;
  onChange?: (iconName: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Nút trigger + dialog căn giữa (Radix Dialog) chứa `IconPicker`. */
export default function IconPickerDialog({ value, onChange, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [mountId, setMountId] = useState(0);

  const triggerGlyph = useMemo(() => {
    const Cmp = getLucideIconComponent(value);
    if (Cmp) {
      return createElement(Cmp, {
        className: 'size-5 shrink-0',
        'aria-hidden': true,
      });
    }
    return createElement(ShapesIcon, {
      className: 'size-5 shrink-0 text-muted-foreground',
      'aria-hidden': true,
    });
  }, [value]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) setMountId((id) => id + 1);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn('min-w-[min(100%,11rem)] justify-between gap-2 px-3', className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {triggerGlyph}
            <span className="truncate text-left text-sm">{value ?? 'Chọn icon'}</span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        showCloseButton
        className="max-h-[min(90dvh,760px)] min-w-0 gap-0 overflow-x-hidden overflow-y-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b px-4 py-3 text-left sm:px-6">
          <DialogTitle>Chọn icon</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-6 pt-3 sm:px-4">
          <IconPicker
            key={mountId}
            value={value}
            onChange={(name) => {
              onChange?.(name);
              setOpen(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
