'use client';

import * as React from 'react';

import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { UserMenu } from '@/components/user-menu';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { ChartPieIcon, CreditCardIcon, LayoutDashboardIcon, SettingsIcon, TagsIcon, WalletIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  match?: 'exact' | 'prefix';
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon, match: 'prefix' },
      { title: 'Báo cáo', url: '/reports', icon: ChartPieIcon, match: 'prefix' },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { title: 'Giao dịch', url: '/transactions', icon: WalletIcon, match: 'prefix' },
      { title: 'Tài khoản', url: '/accounts', icon: CreditCardIcon, match: 'prefix' },
      { title: 'Danh mục', url: '/categories', icon: TagsIcon, match: 'prefix' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [{ title: 'Cài đặt', url: '/settings', icon: SettingsIcon, match: 'prefix' }],
  },
];

function isItemActive(pathname: string, item: NavItem) {
  if (item.match === 'exact') return pathname === item.url;
  if (item.url === '/') return pathname === '/';
  return pathname === item.url || pathname.startsWith(`${item.url}/`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <WorkspaceSwitcher />
        <Separator className="mt-2.5 opacity-40" />
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2.5">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-muted-foreground/50 uppercase px-3.5 mb-1.5 mt-0.5">
              {group.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "relative rounded-xl px-3 py-2.5 h-10 gap-3 cursor-pointer transition-all duration-300 font-medium",
                        "hover:bg-muted/50 dark:hover:bg-muted/20 text-muted-foreground hover:text-foreground",
                        "data-[active=true]:bg-linear-to-r data-[active=true]:from-emerald-500/12 data-[active=true]:to-teal-500/6 data-[active=true]:text-primary data-[active=true]:font-bold data-[active=true]:border-l-3 data-[active=true]:border-primary data-[active=true]:pl-2 data-[active=true]:rounded-l-none"
                      )}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-2.5 group"
                        onClick={() => {
                          // Tự động đóng sidebar trên thiết bị di động khi chuyển trang
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <Icon
                          className={cn(
                            "size-4.5! transition-all duration-300 group-hover:scale-105",
                            active ? "text-primary scale-105" : "text-muted-foreground/80"
                          )}
                          aria-hidden
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {!isMobile && (
        <SidebarFooter className="p-3">
          <Separator className="mb-2.5 opacity-40" />
          <UserMenu />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}
