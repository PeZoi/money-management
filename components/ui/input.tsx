'use client';

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, autoFocus, ref: forwardedRef, ...props }: React.ComponentProps<"input">) {
  const internalRef = React.useRef<HTMLInputElement>(null);

  // Hợp nhất ref bên ngoài truyền vào và ref nội bộ
  const setRefs = React.useCallback(
    (node: HTMLInputElement | null) => {
      (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef != null) {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [forwardedRef]
  );

  // Quản lý autofocus an toàn toàn cục
  React.useEffect(() => {
    if (autoFocus) {
      // Chỉ thực hiện focus bằng JS trên Desktop để tránh làm bật bàn phím ảo và lệch giao diện trên mobile
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        const timer = setTimeout(() => {
          internalRef.current?.focus();
        }, 180); // Trì hoãn nhẹ chờ Dialog/Drawer hoàn tất animation mở ra
        return () => clearTimeout(timer);
      }
    }
  }, [autoFocus]);

  return (
    <input
      ref={setRefs}
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
