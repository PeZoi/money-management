"use client";

import { m } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion-variants";
import { useState } from "react";
import { PrivatePageShell } from "@/components/private-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminUsers, useAdminMutation } from "@/hooks/use-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useConfirm } from "@/hooks/use-confirm";
import { Users, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const { user: currentUser } = useAuth();
  const confirm = useConfirm();

  const { data: users = [], isLoading } = useAdminUsers({
    search,
    role: roleFilter,
  });

  const { updateUserRole, isSubmitting } = useAdminMutation();

  // Xử lý thay đổi vai trò với dialog xác nhận
  const handleRoleChange = async (userId: string, currentRole: string, displayName: string | null) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const label = newRole === "admin" ? "Quản trị viên" : "Người dùng";

    const ok = await confirm({
      title: "Thay đổi vai trò",
      message: `Bạn có chắc muốn thay đổi vai trò của "${displayName || "Người dùng"}" thành "${label}"?`,
    });

    if (ok) {
      await updateUserRole(userId, newRole);
    }
  };

  return (
    <PrivatePageShell
      title="Quản lý Người dùng"
      description="Quản lý danh sách tài khoản người dùng và phân quyền hệ thống."
      icon={Users}
    >
      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm email, tên hiển thị..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as "all" | "admin" | "user")}
          >
            <SelectTrigger className="w-[180px] rounded-xl font-medium cursor-pointer">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem className="cursor-pointer" value="all">Tất cả vai trò</SelectItem>
              <SelectItem className="cursor-pointer" value="admin">Quản trị viên (Admin)</SelectItem>
              <SelectItem className="cursor-pointer" value="user">Người dùng (User)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Số lượng kết quả */}
      {!isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{users.length}</span> người dùng
        </p>
      )}

      {/* Table */}
      <m.div 
        className="mt-3 overflow-hidden rounded-2xl border bg-card"
        variants={fadeSlideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-30px" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Người dùng</th>
                <th className="p-4 hidden sm:table-cell">Email</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4 hidden md:table-cell">Ngày tham gia</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-full" />
                        <Skeleton className="h-4 w-28 rounded" />
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell"><Skeleton className="h-4 w-40 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-8 w-20 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty state
                <tr className="border-b last:border-b-0">
                  <td className="p-4 text-sm font-medium" colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="rounded-full bg-primary/10 p-3.5 mb-3.5">
                        <Users className="size-6 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Không tìm thấy người dùng</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                        {search ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò." : "Chưa có tài khoản nào đăng ký trong hệ thống."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr 
                      key={u.id} 
                      className="transition-colors hover:bg-muted/20 border-b last:border-b-0"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={u.avatar_url}
                            name={u.display_name || u.email}
                            className="size-9"
                            width={36}
                            height={36}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {u.display_name || "Chưa đặt tên"}
                              {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(Bạn)</span>}
                            </p>
                            {/* Hiển thị email trên mobile vì cột email bị ẩn */}
                            <p className="text-xs text-muted-foreground truncate sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                      </td>
                      <td className="p-4">
                        {u.system_role === "admin" ? (
                          <Badge variant="admin" className="gap-1">
                            <ShieldAlert className="size-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="user" className="gap-1">
                            <ShieldCheck className="size-3" />
                            User
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(u.created_at), "dd MMM, yyyy", { locale: vi })}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs cursor-pointer"
                            disabled={isSubmitting}
                            onClick={() => handleRoleChange(u.id, u.system_role, u.display_name)}
                          >
                            {u.system_role === "admin" ? "Hạ cấp" : "Nâng cấp"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </m.div>
    </PrivatePageShell>
  );
}
