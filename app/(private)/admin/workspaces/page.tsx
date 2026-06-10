"use client";

import { m } from "framer-motion";
import { fadeSlideUp } from "@/lib/motion-variants";
import { useState } from "react";
import { PrivatePageShell } from "@/components/private-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAdminWorkspaces } from "@/hooks/use-admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Search, Layers, Users, Archive, Receipt } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function AdminWorkspacesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "personal" | "group">("all");

  const { data: workspaces = [], isLoading } = useAdminWorkspaces({
    search,
    type: typeFilter,
  });

  return (
    <PrivatePageShell
      title="Quản lý Workspace"
      description="Xem danh sách, quản lý cấu trúc và hoạt động của các không gian làm việc trên hệ thống."
      icon={Briefcase}
    >
      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tên workspace, chủ sở hữu..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as "all" | "personal" | "group")}
          >
            <SelectTrigger className="w-[180px] rounded-xl font-medium cursor-pointer">
              <SelectValue placeholder="Tất cả loại hình" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem className="cursor-pointer" value="all">Tất cả loại hình</SelectItem>
              <SelectItem className="cursor-pointer" value="personal">Cá nhân (Personal)</SelectItem>
              <SelectItem className="cursor-pointer" value="group">Nhóm (Shared)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Số lượng kết quả */}
      {!isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{workspaces.length}</span> workspace
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
                <th className="p-4">Workspace</th>
                <th className="p-4 hidden sm:table-cell">Loại hình</th>
                <th className="p-4 hidden md:table-cell">Chủ sở hữu</th>
                <th className="p-4">Thành viên</th>
                <th className="p-4">Giao dịch</th>
                <th className="p-4 hidden md:table-cell">Ngày tạo</th>
                <th className="p-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-4"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="p-4 hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-8 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-8 rounded" /></td>
                    <td className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  </tr>
                ))
              ) : workspaces.length === 0 ? (
                // Empty state
                <tr className="border-b last:border-b-0">
                  <td className="p-4 text-sm font-medium" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="rounded-full bg-primary/10 p-3.5 mb-3.5">
                        <Layers className="size-6 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Không tìm thấy workspace</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
                        {search ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại hình." : "Chưa có workspace nào trong hệ thống."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                workspaces.map((w) => (
                  <tr 
                    key={w.id} 
                    className="transition-colors hover:bg-muted/20 border-b last:border-b-0"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted/30">
                          {w.is_personal ? (
                            <Users className="size-4 text-blue-500" />
                          ) : (
                            <Layers className="size-4 text-violet-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{w.name}</p>
                          {/* Hiển thị thông tin bổ sung trên mobile */}
                          <p className="text-xs text-muted-foreground truncate sm:hidden">
                            {w.is_personal ? "Cá nhân" : "Nhóm"} · {w.member_count} TV · {w.transaction_count} GD
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {w.is_personal ? (
                        <Badge variant="default" className="rounded-full gap-1">
                          <Users className="size-3" />
                          Cá nhân
                        </Badge>
                      ) : (
                        <Badge variant="default" className="rounded-full gap-1 bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/15">
                          <Layers className="size-3" />
                          Nhóm
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={w.owner_avatar_url}
                          name={w.owner_display_name || w.owner_email || ""}
                          className="size-7"
                          width={28}
                          height={28}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{w.owner_display_name || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.owner_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{w.member_count}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="size-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{w.transaction_count}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(w.created_at), "dd MMM, yyyy", { locale: vi })}
                      </p>
                    </td>
                    <td className="p-4">
                      {w.is_archived ? (
                        <Badge variant="default" className="rounded-full gap-1 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15">
                          <Archive className="size-3" />
                          Đã giải tán
                        </Badge>
                      ) : (
                        <Badge variant="default" className="rounded-full gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/15">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                          </span>
                          Hoạt động
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </m.div>
    </PrivatePageShell>
  );
}
