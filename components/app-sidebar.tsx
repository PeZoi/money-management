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
import { 
  ChartPieIcon, 
  CreditCardIcon, 
  LayoutDashboardIcon, 
  Plus, 
  SettingsIcon, 
  TagsIcon, 
  WalletIcon,
  ShieldAlertIcon,
  UsersIcon,
  BriefcaseIcon,
  HeartIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CreateTransactionDialog from '@/app/(private)/transactions/components/create-transaction-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useMyLoveConnection } from '@/hooks/use-love';

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
  const { isMobile, setOpenMobile, state } = useSidebar();
  const [openTxDialog, setOpenTxDialog] = React.useState(false);
  const { user } = useAuth();
  const { data: loveConn } = useMyLoveConnection();

  const displayGroups = React.useMemo(() => {
    // Sao chép sâu navGroups để không ảnh hưởng đến hằng số ban đầu
    const groups = navGroups.map((g) => ({
      ...g,
      items: [...g.items],
    }));

    // Nếu người dùng đã có cặp đôi, thêm menu Ngày bên nhau vào mục 'Tổng quan'
    if (loveConn?.connection_id) {
      const tongQuan = groups.find((g) => g.label === 'Tổng quan');
      if (tongQuan) {
        tongQuan.items.push({
          title: 'Ngày bên nhau',
          url: '/love',
          icon: HeartIcon,
          match: 'prefix',
        });
      }
    }

    if (user?.roleLabel === 'admin') {
      groups.push({
        label: 'Quản trị',
        items: [
          { title: 'Thống kê hệ thống', url: '/admin/dashboard', icon: ShieldAlertIcon, match: 'prefix' },
          { title: 'Quản lý người dùng', url: '/admin/users', icon: UsersIcon, match: 'prefix' },
          { title: 'Quản lý Workspace', url: '/admin/workspaces', icon: BriefcaseIcon, match: 'prefix' },
          { title: 'Kết nối tình yêu', url: '/admin/love', icon: HeartIcon, match: 'prefix' },
        ],
      });
    }
    return groups;
  }, [user, loveConn]);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-3 pt-[calc(env(safe-area-inset-top)+12px)] gap-2.5">
        <WorkspaceSwitcher />
        
        {/* Nút Thêm giao dịch nhanh */}
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setOpenTxDialog(true)}
                  className={cn(
                    "w-full font-semibold",
                    state === 'collapsed' ? "h-9 w-9 p-0 rounded-lg" : "h-10 px-3"
                  )}
                >
                  <Plus className={cn("transition-transform duration-300 group-hover/btn:rotate-90", state === 'collapsed' ? "size-5" : "size-4.5")} />
                  {state !== 'collapsed' && <span>Thêm giao dịch</span>}
                </Button>
              </TooltipTrigger>
              {state === 'collapsed' && (
                <TooltipContent side="right" align="center" sideOffset={12}>
                  Thêm giao dịch
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator className="mt-1 opacity-40" />
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {displayGroups.map((group) => (
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
                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-bold data-[active=true]:border-l-3 data-[active=true]:border-primary data-[active=true]:pl-2 data-[active=true]:rounded-l-none"
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
                        {item.url === '/love' && isMobile && loveConn?.days_together !== undefined && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-primary-foreground shadow-sm select-none">
                            {loveConn.days_together}
                          </span>
                        )}
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
      <CreateTransactionDialog open={openTxDialog} onOpenChange={setOpenTxDialog} />
    </Sidebar>
  );
}
