'use client';

import * as React from 'react';
import { Dialog as DialogNS } from 'radix-ui';
import { ReactLenis } from 'lenis/react';
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
  disableScroll = false,
  disableMobileDrawer = false,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogNS.Content> & {
  showCloseButton?: boolean;
  fullScreenOnMobile?: boolean;
  disableScroll?: boolean;
  disableMobileDrawer?: boolean;
}) {
  const isMobile = useIsMobile() && !disableMobileDrawer;

  // Quản lý chiều cao visual viewport động trên mobile
  const [visualHeight, setVisualHeight] = React.useState<number | null>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return null;
  });

  React.useEffect(() => {
    if (!isMobile || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      setVisualHeight(vv.height);

      // Nếu bàn phím ảo mở (chiều cao visualViewport nhỏ hơn innerHeight > 150px)
      if (window.innerHeight - vv.height > 150) {
        // Đợi native animation cuộn của iOS hoàn tất (khoảng 150ms), nếu layout viewport bị lệch (scrollY > 0) thì kéo về (0,0)
        setTimeout(() => {
          const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
          if (currentScroll > 0) {
            window.scrollTo(0, 0);
          }

          // Tự động cuộn nội bộ để đưa input đang active vào vùng nhìn thấy
          const activeEl = document.activeElement as HTMLElement | null;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            // Tìm container cuộn tổ tiên gần nhất
            let parent = activeEl.parentElement;
            while (parent) {
              const style = window.getComputedStyle(parent);
              const overflowY = style.getPropertyValue('overflow-y');
              if (parent.tagName === 'DIV' && (overflowY === 'auto' || overflowY === 'scroll')) {
                break;
              }
              parent = parent.parentElement;
            }

            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              const childRect = activeEl.getBoundingClientRect();
              
              // Tính toán vị trí cuộn để đưa input vào giữa vùng hiển thị của container
              const targetScrollTop = 
                childRect.top - 
                parentRect.top + 
                parent.scrollTop - 
                (parentRect.height / 2) + 
                (childRect.height / 2);

              parent.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth',
              });
            }
          }
        }, 150);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isMobile]);

  if (isMobile) {
    // Trên thiết bị di động: Tự động biến thành Bottom Sheet với khả năng vuốt kéo để đóng
    // Giới hạn max-height của Drawer theo visual viewport để không bị đẩy vượt quá đỉnh màn hình
    const dynamicStyle = visualHeight 
      ? { maxHeight: `${visualHeight - 12}px` } 
      : undefined;

    return (
      <DrawerNS.DrawerContent
        className={cn(
          // Loại bỏ định vị fixed/translate của modal desktop
          'px-4 pb-6',
          fullScreenOnMobile ? 'h-full' : 'h-auto', // Sử dụng h-full để co giãn theo maxHeight thay vì set cứng vh
          className
        )}
        style={dynamicStyle}
        onOpenAutoFocus={(e) => {
          if (onOpenAutoFocus) {
            onOpenAutoFocus(e);
          } else {
            // Ngăn tự động focus vào input đầu tiên để tránh bàn phím ảo làm giật/lệch giao diện
            e.preventDefault();
          }
        }}
        onCloseAutoFocus={(e) => {
          if (onCloseAutoFocus) {
            onCloseAutoFocus(e);
          } else {
            // Ngăn cuộn nhảy màn hình khi đóng
            e.preventDefault();
          }
        }}
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

  // Trên desktop hoặc khi disableMobileDrawer: Render Dialog truyền thống căn giữa
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogNS.Content
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-lg outline-none duration-200 border-border bg-clip-padding p-0 transition-all',
          disableMobileDrawer
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] rounded-2xl border max-h-[85vh]'
            : fullScreenOnMobile
              ? 'top-35 bottom-0 left-0 translate-x-0 w-full rounded-t-3xl rounded-b-none border-t border-x gap-0 overflow-hidden'
              : 'bottom-0 top-auto left-1/2 -translate-x-1/2 translate-y-0 w-full rounded-t-3xl rounded-b-none border-t border-x max-h-[92dvh] gap-0 overflow-hidden',
          !disableMobileDrawer && 'sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[calc(100%-2rem)] sm:max-w-xl sm:rounded-2xl sm:border sm:max-h-[85vh]',
          disableMobileDrawer
            ? 'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
            : fullScreenOnMobile
              ? 'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-5 sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0'
              : 'data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-10 sm:data-open:zoom-in-95 sm:data-open:slide-in-from-bottom-0',
          !disableMobileDrawer && 'data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom-10 sm:data-closed:zoom-out-95 sm:data-closed:slide-out-to-bottom-0',
          className,
        )}
        onOpenAutoFocus={onOpenAutoFocus}
        onCloseAutoFocus={onCloseAutoFocus}
        {...props}
      >
        {!fullScreenOnMobile && !disableMobileDrawer && (
          <div className="mx-auto my-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20 sm:hidden" />
        )}
        {disableScroll ? (
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        ) : (
          <ReactLenis
            className="flex flex-1 flex-col overflow-y-auto"
            options={{
              duration: 1.0,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              smoothWheel: true,
            }}
          >
            {children}
          </ReactLenis>
        )}
        {showCloseButton ? (
          <DialogNS.Close asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'absolute z-10 rounded-full hover:bg-muted',
                disableMobileDrawer || !fullScreenOnMobile ? 'top-3 right-3' : 'top-4 right-4',
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

