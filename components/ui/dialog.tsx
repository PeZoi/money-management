'use client';

import * as React from 'react';
import { Dialog as DialogNS } from 'radix-ui';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

function Dialog({ ...props }: React.ComponentProps<typeof DialogNS.Root>) {
  return <DialogNS.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogNS.Trigger>) {
  return <DialogNS.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogNS.Portal>) {
  return <DialogNS.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogNS.Close>) {
  return <DialogNS.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogNS.Overlay>) {
  return (
    <DialogNS.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/40 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogNS.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogNS.Content
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-lg outline-none duration-200 border-border bg-clip-padding p-0 transition-all',
          // Mobile: Bottom sheet trượt từ dưới lên, bo góc trên, giới hạn chiều cao tối đa
          'bottom-0 top-auto left-1/2 -translate-x-1/2 translate-y-0 w-full rounded-t-3xl rounded-b-none border-t border-x max-h-[92dvh] gap-0 overflow-hidden',
          // Desktop/Laptop: Modal căn giữa màn hình, giới hạn chiều cao chống cắt hai đầu
          'sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:rounded-2xl sm:border sm:max-h-[85vh]',
          // Hiệu ứng chuyển động mượt mà
          'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0',
          'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 sm:data-closed:zoom-out-95 sm:data-closed:slide-out-to-bottom-0',
          className,
        )}
        {...props}
      >
        {/* Thanh giả lập kéo (drag handle) chỉ hiển thị trên thiết bị di động */}
        <div className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20 sm:hidden" />
        
        {children}
        {showCloseButton ? (
          <DialogNS.Close asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute top-3 right-3 z-10 rounded-full hover:bg-muted"
              size="icon-sm"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Đóng</span>
            </Button>
          </DialogNS.Close>
        ) : null}
      </DialogNS.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-1.5 p-4', className)} {...props} />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogNS.Title>) {
  return (
    <DialogNS.Title
      data-slot="dialog-title"
      className={cn('font-heading font-medium text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogNS.Description>) {
  return (
    <DialogNS.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
