"use client";

import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';

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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types/database';
import Image from 'next/image';

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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

  const initials = initialsFromName(user?.displayName ?? '');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-auto min-h-14 gap-3 px-3 py-2.5 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center!"
            >
              <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground">
                {user?.avatarUrl ? (
                  <Image
                    src={user?.avatarUrl}
                    alt={user?.displayName ?? ''}
                    className="size-full object-cover"
                    width={36}
                    height={36}
                  />
                ) : (
                  <span className="select-none text-xs font-semibold">{initials}</span>
                )}
              </span>
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

          <DropdownMenuContent className="w-56" side="right" align="end" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                    {user?.avatarUrl ? (
                      <Image src={user?.avatarUrl} alt={user?.displayName ?? ''} className="size-full object-cover" width={36}
                      height={36} />
                    ) : (
                      <span className="text-xs font-semibold">{initials}</span>
                    )}
                  </span>
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
              <DropdownMenuItem>
                <SettingsIcon />
                Cài đặt
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
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
