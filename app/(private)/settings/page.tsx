"use client";

import { PrivatePageShell } from "@/components/private-page-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TransactionWithCategory } from "@/types";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  BuildingIcon,
  CalendarIcon,
  CoinsIcon,
  CrownIcon,
  EyeIcon,
  Loader2Icon,
  LogOutIcon,
  MailIcon,
  SettingsIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import * as React from "react";
import ArchivedTransactionsList from "./components/archived-transactions-list";
import { useSettings } from "./hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";

const PRESETS: Array<{ name: string; value: string }> = [
  { name: "Xanh lá", value: "#16a34a" },
  { name: "Xanh dương", value: "#2563eb" },
  { name: "Tím", value: "#7c3aed" },
  { name: "Cam", value: "#ea580c" },
  { name: "Đỏ", value: "#dc2626" },
  { name: "Đen", value: "#171717" },
];

export default function SettingsPage() {
  const { signOut } = useAuth();
  const {
    theme,
    color,
    user,
    setPrimary,
    resetPrimary,
    activeWorkspace,
    activeTab,
    setActiveTab,
    groupName,
    setGroupName,
    inviteEmail,
    setInviteEmail,
    members,
    membersLoading,
    archivedGroups,
    archivedLoading,
    memberToKick,
    setMemberToKick,
    openArchiveDialog,
    setOpenArchiveDialog,
    settleUp,
    setSettleUp,
    accountsLoading,
    openLeaveDialog,
    setOpenLeaveDialog,
    openTransferDialog,
    setOpenTransferDialog,
    selectedNewOwner,
    setSelectedNewOwner,
    groupForHistory,
    setGroupForHistory,
    transactions,
    transactionsLoading,
    groupToDelete,
    setGroupToDelete,
    isSubmitting,
    handleUpdateName,
    handleInviteMember,
    handleKickMember,
    handleArchiveGroup,
    handleLeaveGroup,
    handleTransferAndLeave,
    handleDeleteArchivedGroup,
    totalBalance,
    shareAmount,
    remainderAmount,
    formatVND,
    formatDate,
    isCurrentOwner,
    invitations,
    invitationsLoading,
    acceptInvitation,
    declineInvitation,
  } = useSettings();

  const acceptedMembers = React.useMemo(() => members.filter((m) => m.status !== "pending"), [members]);
  const pendingMembers = React.useMemo(() => members.filter((m) => m.status === "pending"), [members]);


  return (
    <PrivatePageShell
      title="Cài đặt"
      description="Quản lý ứng dụng, cấu hình nhóm chi tiêu và lưu trữ nhóm."
      icon={SettingsIcon}
      contentClassName="max-w-4xl"
    >
      {/* Tab Navigation */}
      {/* Cho phép cuộn ngang và ẩn thanh cuộn ở thiết bị di động */}
      <div className="mt-8 border-b border-border overflow-x-auto no-scrollbar">
        <div className="flex space-x-6 min-w-max pb-px">
          <button
            onClick={() => setActiveTab("appearance")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeTab === "appearance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <SettingsIcon className="size-4" />
            Giao diện
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeTab === "group"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <UsersIcon className="size-4" />
            Cài đặt nhóm
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeTab === "archived"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <ArchiveIcon className="size-4" />
            Nhóm đã lưu trữ
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={cn(
              "pb-4 text-sm font-semibold border-b-2 transition-colors relative flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeTab === "invitations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MailIcon className="size-4" />
            Lời mời
            {invitations.length > 0 && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs">
                {invitations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Tab 1: Appearance */}
        {activeTab === "appearance" && (
          <div className="grid gap-6">
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h2 className="text-base font-semibold">Màu chủ đạo</h2>
              <p className="text-xs text-muted-foreground mt-1">Thay đổi tông màu chủ đạo cho toàn bộ giao diện.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrimary(p.value)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.value }} />
                    <span className={cn(color === p.value && "font-semibold text-primary")}>{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
                <label className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Tùy chọn màu</span>
                  <input
                    aria-label="Chọn màu chủ đạo"
                    type="color"
                    value={color}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-md border border-border bg-background p-1"
                  />
                  <code className="rounded-md bg-muted px-2 py-1 text-xs font-mono">{color}</code>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-2">Bản xem trước:</span>
                  <Button type="button">Primary Button</Button>
                  <Button type="button" variant="outline">
                    Outline
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Trạng thái theme</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Màu chủ đạo hiện tại:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-medium">
                    {theme.primary || color}
                  </code>
                </div>
              </div>
              <Button variant="outline" onClick={resetPrimary} type="button">
                Reset về mặc định
              </Button>
            </section>

            {/* Section 3: Tài khoản & Đăng xuất */}
            <section className="rounded-xl border border-border/80 bg-linear-to-r from-card to-muted/20 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/2 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.displayName || user?.email}
                  className="h-14 w-14 border-2 border-background shadow-md transition-transform duration-300 hover:scale-105"
                  width={56}
                  height={56}
                />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-foreground tracking-tight">{user?.displayName || "Người dùng"}</h2>
                  <p className="text-xs text-muted-foreground font-medium truncate mt-1 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => signOut()}
                className="font-semibold px-5 py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer self-start sm:self-auto h-10 gap-2 relative z-10"
              >
                <LogOutIcon className="size-4" />
                Đăng xuất
              </Button>
            </section>
          </div>
        )}

        {/* Tab 2: Group Settings */}
        {activeTab === "group" && (
          <div className="grid gap-6">
            {activeWorkspace?.is_personal ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 px-4 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BuildingIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Đang ở Workspace Cá nhân</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Cài đặt nhóm chỉ áp dụng cho các Workspace dạng Nhóm dùng chung. 
                  Hãy chọn một nhóm chi tiêu từ menu chuyển Workspace ở góc trên bên trái để tiếp tục.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Group info & Rename */}
                <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <h2 className="text-base font-semibold">Thông tin nhóm</h2>
                  <p className="text-xs text-muted-foreground mt-1">Thay đổi tên nhóm hiển thị với mọi người.</p>

                  <form onSubmit={handleUpdateName} className="mt-4 flex gap-3 max-w-md">
                    <Input
                      aria-label="Tên nhóm"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Nhập tên nhóm mới..."
                      required
                      disabled={isSubmitting}
                    />
                    <Button type="submit" disabled={isSubmitting || groupName.trim() === activeWorkspace?.name}>
                      {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                      Lưu
                    </Button>
                  </form>
                </section>

                {/* 2. Members Management */}
                <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 mb-4">
                    <div>
                      <h2 className="text-base font-semibold">Thành viên ({acceptedMembers.length})</h2>
                      <p className="text-xs text-muted-foreground mt-1">Danh sách những người dùng chung tài khoản quỹ này.</p>
                    </div>

                    {isCurrentOwner && (
                      <form onSubmit={handleInviteMember} className="flex gap-2 w-full sm:max-w-sm">
                        <Input
                          type="email"
                          placeholder="Nhập email thành viên..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          disabled={isSubmitting}
                          className="text-sm h-9"
                        />
                        <Button type="submit" size="sm" className="h-9 shrink-0" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <Loader2Icon className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserPlusIcon className="mr-1.5 size-4" />
                              Mời
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>

                  {membersLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                      Đang tải danh sách thành viên...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Danh sách thành viên chính thức */}
                      <div>
                        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                          Thành viên chính thức ({acceptedMembers.length})
                        </h3>
                        <div className="divide-y divide-border rounded-lg border border-border bg-muted/10 px-4">
                          {acceptedMembers.map((member) => {
                            const isMemberOwner = member.role === "owner";
                            const isMe = member.user_id === user?.id;
                            return (
                              <div key={member.id || member.member_id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={member.avatar_url}
                                    name={member.display_name || member.email}
                                    className="h-9 w-9 border border-border"
                                    width={36}
                                    height={36}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold flex items-center gap-1.5">
                                      <span className="truncate max-w-[150px] sm:max-w-[300px]">
                                        {member.display_name || "Chưa đặt tên"}
                                      </span>
                                      {isMe && (
                                        <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-xxs font-medium text-muted-foreground">
                                          Bạn
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {isMemberOwner ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                      <CrownIcon className="size-3" />
                                      Chủ nhóm
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                                      Thành viên
                                    </span>
                                  )}

                                  {isCurrentOwner && !isMemberOwner && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setMemberToKick(member)}
                                      className="text-destructive hover:bg-destructive/10 rounded-full"
                                      title="Xóa thành viên"
                                      disabled={isSubmitting}
                                    >
                                      <TrashIcon className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Danh sách lời mời đang chờ */}
                      {pendingMembers.length > 0 && (
                        <div>
                          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                            Lời mời đang chờ ({pendingMembers.length})
                          </h3>
                          <div className="divide-y divide-border rounded-lg border border-border bg-muted/10 px-4">
                            {pendingMembers.map((member) => (
                              <div key={member.id || member.member_id} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3 opacity-70">
                                  <Avatar
                                    src={member.avatar_url}
                                    name={member.display_name || member.email}
                                    className="h-9 w-9 border border-border grayscale"
                                    width={36}
                                    height={36}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold flex items-center gap-1.5">
                                      <span className="truncate max-w-[150px] sm:max-w-[300px]">
                                        {member.display_name || "Chưa đặt tên"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                                      {member.email}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    Chờ chấp nhận
                                  </span>

                                  {isCurrentOwner && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => setMemberToKick(member)}
                                      className="text-destructive hover:bg-destructive/10 rounded-full"
                                      title="Hủy lời mời"
                                      disabled={isSubmitting}
                                    >
                                      <TrashIcon className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 3. Danger Zone */}
                <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 shadow-xs">
                  <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
                  <p className="text-xs text-muted-foreground mt-1">Các thao tác ảnh hưởng vĩnh viễn tới nhóm chi tiêu.</p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {isCurrentOwner ? (
                      <>
                        <Button
                          variant="destructive"
                          disabled={isSubmitting}
                          onClick={() => {
                            if (members.length === 1) {
                              setOpenLeaveDialog(true);
                            } else {
                              setOpenTransferDialog(true);
                            }
                          }}
                        >
                          <LogOutIcon className="mr-1.5 size-4" />
                          Rời nhóm
                        </Button>

                        <Button
                          variant="outline"
                          disabled={isSubmitting}
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => setOpenArchiveDialog(true)}
                        >
                          <ArchiveIcon className="mr-1.5 size-4" />
                          Giải tán nhóm (Archive)
                        </Button>
                      </>
                    ) : (
                      <Button variant="destructive" disabled={isSubmitting} onClick={() => setOpenLeaveDialog(true)}>
                        <LogOutIcon className="mr-1.5 size-4" />
                        Rời nhóm
                      </Button>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Archived Groups */}
        {activeTab === "archived" && (
          <div className="grid gap-6">
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h2 className="text-base font-semibold">Danh sách nhóm đã lưu trữ</h2>
              <p className="text-xs text-muted-foreground mt-1">Các nhóm đã giải tán. Bạn có thể xem lịch sử giao dịch cũ (chỉ đọc) hoặc xóa hẳn khỏi giao diện.</p>

              {archivedLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                  Đang tải danh sách nhóm lưu trữ...
                </div>
              ) : archivedGroups.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <ArchiveIcon className="size-8 text-muted-foreground/40" />
                  <span>Không có nhóm nào đã lưu trữ.</span>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {archivedGroups.map((group) => (
                    <div key={group.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 gap-3">
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          <span>{group.name}</span>
                          <span className="inline-flex items-center rounded-sm bg-amber-500/10 px-1.5 py-0.5 text-xxs font-medium text-amber-600 dark:text-amber-400">
                            Đã Đóng Băng
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          Tạo ngày: {formatDate(group.created_at)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setGroupForHistory(group)} className="text-xs">
                          <EyeIcon className="mr-1.5 size-3.5" />
                          Xem lịch sử
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => setGroupToDelete(group)}
                          className="text-xs text-destructive hover:bg-destructive/10"
                        >
                          <TrashIcon className="mr-1.5 size-3.5" />
                          Xóa khỏi tôi
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 4: Invitations */}
        {activeTab === "invitations" && (
          <div className="grid gap-6">
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <h2 className="text-base font-semibold">Lời mời vào nhóm chi tiêu</h2>
              <p className="text-xs text-muted-foreground mt-1">Danh sách các nhóm chi tiêu chung mời bạn tham gia.</p>

              {invitationsLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
                  Đang tải danh sách lời mời...
                </div>
              ) : invitations.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground/60">
                    <MailIcon className="h-6 w-6" />
                  </div>
                  <span className="font-medium text-muted-foreground">Bạn không có lời mời nào mới.</span>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-border">
                  {invitations.map((inv) => (
                    <div key={inv.invitation_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                          <UsersIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{inv.workspace_name}</span>
                            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-xxs font-medium text-primary">
                              Lời mời mới
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Người mời: <span className="font-medium text-foreground">{inv.invited_by_email}</span>
                          </div>
                          <div className="text-xxs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            Nhận lúc: {formatDate(inv.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => declineInvitation(inv.invitation_id)}
                          className="text-xs border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                        >
                          Từ chối
                        </Button>
                        <Button
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => acceptInvitation(inv.invitation_id)}
                          className="text-xs"
                        >
                          {isSubmitting && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />}
                          Chấp nhận
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* dialog 1: Kick Member Confirm */}
      <Dialog open={!!memberToKick} onOpenChange={(open) => !open && setMemberToKick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trục xuất thành viên?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thành viên <span className="font-semibold text-foreground">{memberToKick?.display_name || memberToKick?.email}</span> khỏi nhóm này không? Người dùng này sẽ không còn quyền xem hay tương tác với nhóm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToKick(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleKickMember} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 2: Leave Group Confirm (For Member or Single Owner) */}
      <Dialog open={openLeaveDialog} onOpenChange={setOpenLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rời khỏi nhóm chi tiêu?</DialogTitle>
            <DialogDescription>
              {isCurrentOwner && members.length === 1 ? (
                <span>
                  Bạn là thành viên duy nhất trong nhóm. Khi rời đi, nhóm sẽ bị xóa vĩnh viễn khỏi hệ thống cùng với mọi tài khoản, danh mục và giao dịch liên quan. Hành động này không thể hoàn tác.
                </span>
              ) : (
                <span>
                  Bạn có chắc chắn muốn rời khỏi nhóm này không? Bạn sẽ mất toàn bộ quyền truy cập và dữ liệu liên quan đến nhóm chi tiêu này.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLeaveDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={isCurrentOwner && members.length === 1 ? handleArchiveGroup : handleLeaveGroup} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận rời
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 3: Transfer Owner Dialog (For Owner leaving multi-member group) */}
      <Dialog open={openTransferDialog} onOpenChange={(open) => {
        setOpenTransferDialog(open);
        if (!open) setSelectedNewOwner("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển nhượng chủ nhóm & Rời nhóm</DialogTitle>
            <DialogDescription>
              Bạn đang là Chủ nhóm. Trước khi rời khỏi nhóm, bạn bắt buộc phải chuyển nhượng quyền Chủ nhóm (Owner) cho một thành viên khác đang hoạt động.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium block mb-2">Chọn Chủ nhóm mới:</label>
            <select
              value={selectedNewOwner}
              onChange={(e) => setSelectedNewOwner(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
            >
              <option value="">-- Chọn thành viên nhận quyền --</option>
              {members
                .filter((m) => m.user_id !== user?.id)
                .map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name || m.email} ({m.email})
                  </option>
                ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTransferDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleTransferAndLeave} disabled={isSubmitting || !selectedNewOwner}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận & Rời nhóm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 4: Archive Group (Settle accounts) */}
      <Dialog open={openArchiveDialog} onOpenChange={setOpenArchiveDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangleIcon className="size-5" />
              Giải tán và Lưu trữ nhóm
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ đóng băng nhóm chi tiêu này vĩnh viễn. Tất cả thành viên sẽ chuyển sang chế độ Chỉ Đọc (Read-only) và không thể thay đổi dữ liệu được nữa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3.5">
              <input
                id="settle-checkbox"
                type="checkbox"
                checked={settleUp}
                onChange={(e) => setSettleUp(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
              <div className="text-sm">
                <label htmlFor="settle-checkbox" className="font-semibold select-none cursor-pointer">
                  Tất toán số dư nhóm về 0đ
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tự động chia đều toàn bộ tiền quỹ trong các tài khoản dùng chung của nhóm cho các thành viên. Số dư tài khoản của nhóm sẽ được đưa về 0đ.
                </p>
              </div>
            </div>

            {settleUp && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <CoinsIcon className="size-4 text-primary" />
                  Bảng phân chia dự kiến
                </h4>
                {accountsLoading ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 py-2">
                    <Loader2Icon className="size-3 animate-spin" />
                    Đang tính toán số dư...
                  </div>
                ) : (
                  <div className="text-xs space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Tổng quỹ nhóm cần chia:</span>
                      <span className="font-semibold text-foreground">{formatVND(totalBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số lượng thành viên:</span>
                      <span className="font-semibold text-foreground">{members.length} người</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
                      <span>Mỗi người nhận:</span>
                      <span className="font-semibold text-primary">{formatVND(shareAmount)}</span>
                    </div>
                    {remainderAmount > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                        <span>Chênh lệch tiền lẻ (Chủ nhóm giữ):</span>
                        <span>+{formatVND(remainderAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenArchiveDialog(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleArchiveGroup}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận giải tán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 5: View History (Read-only transactions of archived group) */}
      <Dialog open={!!groupForHistory} onOpenChange={(open) => !open && setGroupForHistory(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <DialogTitle>Lịch sử giao dịch: {groupForHistory?.name}</DialogTitle>
            <DialogDescription>
              Bản xem trước chỉ đọc các giao dịch đã thực hiện trong nhóm này trước khi giải tán.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <ArchivedTransactionsList
              transactions={transactions as TransactionWithCategory[]}
              isLoading={transactionsLoading}
            />
          </div>

          <DialogFooter className="p-4 border-t border-border bg-muted/10">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setGroupForHistory(null)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog 6: Delete Archived Group Confirm */}
      <Dialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa khỏi danh sách lưu trữ?</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nhóm <span className="font-semibold text-foreground">{groupToDelete?.name}</span> khỏi danh sách lưu trữ của bạn không? Bạn sẽ không thể xem lại lịch sử giao dịch này nữa. Nếu bạn là thành viên cuối cùng của nhóm, dữ liệu nhóm sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupToDelete(null)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteArchivedGroup} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivatePageShell>
  );
}
