'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useBottomNavStore, ALL_NAV_ITEMS } from '@/hooks/use-bottom-nav-store';
import { useMyLoveConnection } from '@/hooks/use-love';

export function BottomNav() {
  const pathname = usePathname();
  const { items } = useBottomNavStore();
  const [mounted, setMounted] = React.useState(false);
  const { data: loveConn } = useMyLoveConnection();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Để tránh lỗi Hydration mismatch của Next.js SSR,
  // chúng ta sử dụng danh sách mặc định trước khi component được mount trên client.
  const displayKeys = mounted 
    ? items 
    : ['dashboard', 'accounts', 'transactions', 'categories', 'settings'] as const;

  // Map các key sang cấu hình item đầy đủ và chỉ định vị trí ở giữa là nút nổi bật
  const navItems = displayKeys.map((key, index) => ({
    ...ALL_NAV_ITEMS[key],
    isCenter: index === 2,
  }));

  // Kiểm tra đường dẫn hiện tại để active link phù hợp
  const isItemActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-lg md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-4">
        {navItems.map((item, index) => {
          const active = isItemActive(item.url);
          const Icon = item.icon;

          // Thiết kế nổi bật đặc biệt cho nút ở giữa
          if (item.isCenter) {
            return (
              <Link
                key={`${item.key}-${index}`}
                href={item.url}
                className="relative -top-5 flex flex-col items-center justify-center group"
              >
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg transition-all duration-300 group-hover:scale-105 active:scale-95 group-active:scale-95",
                    active
                      ? "bg-primary shadow-primary/40 ring-2 ring-primary/20"
                      : "bg-primary/95 hover:bg-primary shadow-primary/20"
                  )}
                >
                  <div className="relative">
                    <Icon className="size-6" />
                    {/* Badge số ngày bên nhau trên mobile cho nút chính giữa */}
                    {item.key === 'love' && loveConn?.days_together !== undefined && (
                      <span className="absolute -top-2 -right-3 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-extrabold text-white shadow-sm border border-background animate-in zoom-in duration-300">
                        {loveConn.days_together}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wide mt-1 transition-colors duration-200",
                    active ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </span>
                {active && (
                  <span className="absolute -bottom-1 size-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          }

          // Thiết kế cho các nút thông thường khác
          return (
            <Link
              key={`${item.key}-${index}`}
              href={item.url}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 hover:bg-muted/50 active:scale-95"
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "size-5 transition-transform duration-200",
                    active ? "text-primary scale-105" : "text-muted-foreground/80"
                  )}
                />
                {/* Badge số ngày bên nhau trên mobile cho nút bình thường */}
                {item.key === 'love' && loveConn?.days_together !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-extrabold text-white shadow-xs animate-in zoom-in duration-300">
                    {loveConn.days_together}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide mt-1 transition-colors duration-200",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {item.title}
              </span>
              {active && (
                <span className="absolute bottom-[-2px] size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
