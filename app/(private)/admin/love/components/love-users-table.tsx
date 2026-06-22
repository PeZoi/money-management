'use client';

import * as React from 'react';
import { m } from 'framer-motion';
import { fadeSlideUp } from '@/lib/motion-variants';
import { 
  Heart, 
  UserPlus, 
  UserMinus, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminLoveUser } from '@/types/database';

interface LoveUsersTableProps {
  users: AdminLoveUser[];
  isLoading: boolean;
  onOpenConnect: (user: AdminLoveUser) => void;
  onOpenDisconnect: (connectionId: string, u1: string, u2: string) => void;
}

export function LoveUsersTable({
  users,
  isLoading,
  onOpenConnect,
  onOpenDisconnect,
}: LoveUsersTableProps) {
  return (
    <m.div 
      className="bg-card rounded-xl border overflow-hidden shadow-sm"
      variants={fadeSlideUp}
    >
      {isLoading ? (
        <div className="p-8 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          Không tìm thấy người dùng nào phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground text-sm font-semibold">
                <th className="p-4 pl-6">Người dùng</th>
                <th className="p-4">Email</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Kết nối với</th>
                <th className="p-4">Ngày kỷ niệm</th>
                <th className="p-4 pr-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors border-b last:border-b-0">
                  {/* User Profile */}
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <Avatar 
                      src={user.avatar_url} 
                      name={user.display_name} 
                      className="size-9 border" 
                      width={36} 
                      height={36} 
                    />
                    <span className="font-semibold block max-w-[150px] truncate">
                      {user.display_name}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="p-4 text-muted-foreground">{user.email}</td>

                  {/* Status Badge */}
                  <td className="p-4">
                    {user.connection_id ? (
                      <Badge variant="default" className="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 rounded-full px-3 py-1">
                        Đã bắt cặp
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50/50 dark:text-yellow-500 dark:border-yellow-900/30 dark:bg-yellow-950/10 rounded-full px-3 py-1">
                        Độc thân
                      </Badge>
                    )}
                  </td>

                  {/* Partner display */}
                  <td className="p-4 font-medium">
                    {user.partner_name ? (
                      <span className="text-foreground flex items-center gap-1.5">
                        <Heart className="size-3.5 fill-rose-500 text-rose-500" />
                        {user.partner_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Anniversary date */}
                  <td className="p-4 text-muted-foreground">
                    {user.anniversary_date ? (
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        {new Date(user.anniversary_date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 pr-6 text-right">
                    {user.connection_id ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onOpenDisconnect(
                          user.connection_id!, 
                          user.display_name || 'User 1', 
                          user.partner_name || 'User 2'
                        )}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-xl"
                      >
                        <UserMinus className="size-4 mr-1.5" />
                        Hủy bắt cặp
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onOpenConnect(user)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/20 cursor-pointer rounded-xl"
                      >
                        <UserPlus className="size-4 mr-1.5" />
                        Bắt cặp
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </m.div>
  );
}
