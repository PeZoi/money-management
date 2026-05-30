'use client';

import * as React from 'react';
import { Dialog as DialogNS } from 'radix-ui';
import * as DrawerNS from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';

function Dialog({ ...props }: React.ComponentProps<typeof DialogNS.Root>) {
  // Sử dụng hook kiểm tra mobile để quyết định render Dialog hay Drawer
  const isMobile = useIsMobile();
  return isMobile ? <DrawerNS.Drawer {...props} /> : <DialogNS.Root {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogNS.Trigger>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerNS.DrawerTrigger {...props} /> : <DialogNS.Trigger {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogNS.Portal>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerNS.DrawerPortal {...props} /> : <DialogNS.Portal {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogNS.Close>) {
  const isMobile = useIsMobile();
  return isMobile ? <DrawerNS.DrawerClose {...props} /> : <DialogNS.Close {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogNS.Overlay>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return <DrawerNS.DrawerOverlay className={className} {...props} />;
  }
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
  fullScreenOnMobile = false,
  ...props
}: React.ComponentProps<typeof DialogNS.Content> & {
  showCloseButton?: boolean;
  fullScreenOnMobile?: boolean;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Trên thiết bị di động: Tự động biến thành Bottom Sheet với khả năng vuốt kéo để đóng
    return (
      <DrawerNS.DrawerContent
        className={cn(
          // Loại bỏ định vị fixed/translate của modal desktop
          'px-4 pb-8',
          fullScreenOnMobile && 'h-[96dvh] max-h-[96dvh]', // Xử lý nếu form yêu cầu chế độ tràn màn hình
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerNS.DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="absolute z-10 rounded-full hover:bg-muted top-4 right-4"
              size="icon-sm"
            >
              <XIcon className="size-4" />
              <span className="sr-only">Đóng</span>
            </Button>
          </DrawerNS.DrawerClose>
        ) : null}
      </DrawerNS.DrawerContent>
    );
  }

  // Trên desktop: Render Dialog truyền thống căn giữa
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogNS.Content
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-lg outline-none duration-200 border-border bg-clip-padding p-0 transition-all',
          fullScreenOnMobile
            ? 'top-35 bottom-0 left-0 translate-x-0 w-full rounded-t-3xl rounded-b-none border-t border-x gap-0 overflow-y-auto'
            : 'bottom-0 top-auto left-1/2 -translate-x-1/2 translate-y-0 w-full rounded-t-3xl rounded-b-none border-t border-x max-h-[92dvh] gap-0 overflow-hidden',
          'sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:rounded-2xl sm:border sm:max-h-[85vh]',
          fullScreenOnMobile
            ? 'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-5 sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0'
            : 'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0',
          'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 sm:data-closed:zoom-out-95 sm:data-closed:slide-out-to-bottom-0',
          className,
        )}
        {...props}
      >
        {!fullScreenOnMobile && (
          <div className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20 sm:hidden" />
        )}
        {children}
        {showCloseButton ? (
          <DialogNS.Close asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'absolute z-10 rounded-full hover:bg-muted',
                fullScreenOnMobile ? 'top-4 right-4' : 'top-3 right-3',
              )}
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
  const isMobile = useIsMobile();
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        isMobile ? 'flex flex-col gap-1.5 pb-2 text-center' : 'flex flex-col gap-1.5 p-4',
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  const isMobile = useIsMobile();
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        isMobile ? 'mt-auto flex flex-col gap-2 pt-2' : 'mt-auto flex flex-col gap-2 p-4',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogNS.Title>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <DrawerNS.DrawerTitle className={className} {...props} />
  ) : (
    <DialogNS.Title
      data-slot="dialog-title"
      className={cn('font-heading font-medium text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogNS.Description>) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <DrawerNS.DrawerDescription className={className} {...props} />
  ) : (
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

