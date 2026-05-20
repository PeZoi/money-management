'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboardIcon, CreditCardIcon, WalletIcon, TagsIcon, SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  // Danh sách các mục điều hướng trên bottom bar
  const navItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboardIcon,
    },
    {
      title: 'Tài khoản',
      url: '/accounts',
      icon: CreditCardIcon,
    },
    {
      title: 'Giao dịch', // Nút ở giữa nổi bật nhất
      url: '/transactions',
      icon: WalletIcon,
      isCenter: true,
    },
    {
      title: 'Danh mục',
      url: '/categories',
      icon: TagsIcon,
    },
    {
      title: 'Cài đặt',
      url: '/settings',
      icon: SettingsIcon,
    },
  ];

  // Kiểm tra đường dẫn hiện tại để active link phù hợp
  const isItemActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/80 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur-lg md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const active = isItemActive(item.url);
          const Icon = item.icon;

          // Thiết kế nổi bật đặc biệt cho nút Giao dịch ở giữa
          if (item.isCenter) {
            return (
              <Link
                key={item.title}
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
                  <Icon className="size-6" />
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
              key={item.title}
              href={item.url}
              className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 hover:bg-muted/50 active:scale-95"
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-200",
                  active ? "text-primary scale-105" : "text-muted-foreground/80"
                )}
              />
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
