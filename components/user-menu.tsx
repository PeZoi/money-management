'use client';

import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon, Sun, Moon } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types/database';
import Link from 'next/link';
import { useTheme } from '@/components/theme-provider';

function roleMapToVietnamese(role: UserRole | undefined): string {
  switch (role) {
    case 'user':
      return 'Người dùng';
    case 'admin':
      return 'Quản trị viên';
    default:
      return 'Không xác định';
  }
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const { themeMode, toggleThemeMode } = useTheme();

  if (isMobile) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-auto min-h-14 gap-3 px-3 py-2.5 cursor-pointer rounded-xl border transition-all duration-300",
                "border-border/40 bg-card/40 dark:bg-card/20 shadow-xs backdrop-blur-xs",
                "hover:bg-muted/80 hover:border-border/60",
                "group-data-[state=open]:bg-muted group-data-[state=open]:border-border/60 group-data-[state=open]:shadow-xs",
                "group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center!"
              )}
            >
              {/* Sử dụng component Avatar dùng chung cho tài khoản ở sidebar */}
              <Avatar
                src={user?.avatarUrl}
                name={user?.displayName}
                className="size-9 border-sidebar-border"
                width={36}
                height={36}
              />
              <div className="grid min-w-0 flex-1 gap-1 text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold text-sidebar-foreground">{user?.displayName}</span>
                <Badge variant={user?.roleLabel as UserRole} className="max-w-full justify-start">
                  <span className="truncate">{roleMapToVietnamese(user?.roleLabel as UserRole)}</span>
                </Badge>
              </div>
              <ChevronDownIcon
                aria-hidden
                className="ml-auto shrink-0 text-sidebar-foreground/70 group-data-[state=open]:rotate-180 group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[calc(var(--sidebar-width)-24px)] sm:w-56 rounded-xl border-border/60 shadow-xl"
            side={isMobile ? 'top' : 'right'}
            align={isMobile ? 'start' : 'end'}
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {/* Sử dụng component Avatar dùng chung cho tài khoản ở menu dropdown */}
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.displayName}
                    className="size-9 border-border"
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold leading-tight text-black">{user?.displayName}</p>
                    <Badge variant={user?.roleLabel as UserRole} className="mt-1.5 max-w-full">
                      <span className="truncate">{roleMapToVietnamese(user?.roleLabel as UserRole)}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon />
                Hồ sơ
              </DropdownMenuItem>
              <Link
                href="/settings"
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <DropdownMenuItem>
                  <SettingsIcon />
                  Cài đặt
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => toggleThemeMode()} className="cursor-pointer">
                {themeMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                <span>{themeMode === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => signOut()} className="cursor-pointer">
                <LogOutIcon />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
