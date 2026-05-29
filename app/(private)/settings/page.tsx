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
  SparklesIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import * as React from "react";
import ArchivedTransactionsList from "./components/archived-transactions-list";
import { useSettings } from "./hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { SETTINGS_KEY, getLocalStorageItem, setLocalStorageItem } from "@/functions/localstorage-fn";

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

  // Cài đặt giao dịch thông minh: bật/tắt preview trước khi lưu
  const [smartTxPreview, setSmartTxPreview] = React.useState(true);
  const [hasMountedSmartTx, setHasMountedSmartTx] = React.useState(false);

  React.useEffect(() => {
    const saved = getLocalStorageItem(SETTINGS_KEY.SMART_TX_PREVIEW);
    const isTrue = saved !== null ? saved === "true" : true;

    // Gom nhóm setState vào luồng bất đồng bộ để tránh linter warning
    setTimeout(() => {
      setSmartTxPreview(isTrue);
      setHasMountedSmartTx(true);
    }, 0);
  }, []);

  const handleToggleSmartTxPreview = (checked: boolean) => {
    setSmartTxPreview(checked);
    setLocalStorageItem(SETTINGS_KEY.SMART_TX_PREVIEW, String(checked));
  };
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
    resetRange,
    setResetRange,
    resetValue,
    setResetValue,
    keepBalance,
    setKeepBalance,
    confirmKeyword,
    setConfirmKeyword,
    isResetting,
    openResetDialog,
    setOpenResetDialog,
    handleResetTransactions,
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
            {activeWorkspace?.is_personal ? (
              <BuildingIcon className="size-4" />
            ) : (
              <UsersIcon className="size-4" />
            )}
            {activeWorkspace?.is_personal ? "Quản lý Workspace" : "Cài đặt nhóm"}
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

            {/* Section 3: Cài đặt giao dịch thông minh */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <SparklesIcon className="size-4 text-amber-500" />
                </div>
                <h2 className="text-base font-semibold">Giao dịch thông minh</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Tùy chỉnh hành vi khi thêm giao dịch bằng tab Tự động (AI + nhận dạng).
              </p>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <ZapIcon className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Xem lại trước khi lưu</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Khi bật, dữ liệu nhận dạng tự động sẽ được chuyển sang tab Thủ công để bạn kiểm tra lại trước khi lưu.
                    </p>
                  </div>
                </div>
                {hasMountedSmartTx && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={smartTxPreview}
                    onClick={() => handleToggleSmartTxPreview(!smartTxPreview)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      smartTxPreview ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                        smartTxPreview ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                )}
              </div>
            </section>

            {/* Section 4: Tài khoản & Đăng xuất */}
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
              <>
                {/* 1. Workspace Info */}
                <section className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <h2 className="text-base font-semibold">Thông tin Workspace Cá nhân</h2>
                  <p className="text-xs text-muted-foreground mt-1">Workspace mặc định phục vụ cho quản lý chi tiêu cá nhân của riêng bạn.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 max-w-xl">
                    <div className="rounded-lg border border-border bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Tên Workspace</span>
                      <p className="text-sm font-semibold mt-0.5">{activeWorkspace?.name || "Cá nhân"}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Loại tài khoản</span>
                      <p className="text-sm font-semibold mt-0.5 text-primary flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Cá nhân (Không chia sẻ)
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-red-500/20 bg-linear-to-br from-red-500/5 via-red-500/[0.01] to-red-500/[0.03] p-6 shadow-xs relative overflow-hidden dark:border-red-500/30 dark:from-red-950/20 dark:via-red-950/5 dark:to-red-950/10">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none dark:bg-red-500/5" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none dark:bg-red-500/2" />
                  
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive shadow-xs shrink-0 transition-transform duration-300 hover:scale-105">
                      <AlertTriangleIcon className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base font-bold tracking-tight text-foreground">Quản lý Dữ liệu & Reset</h2>
                      <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                        Xóa vĩnh viễn dữ liệu giao dịch trong Workspace cá nhân theo phạm vi thời gian. Hành động này được thực hiện trực tiếp trên cơ sở dữ liệu và <span className="text-destructive font-medium">không thể khôi phục</span>.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 max-w-xl">
                    {/* Range Selector (Modern Cards Grid) */}
                    <div className="flex flex-col gap-2.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phạm vi dọn dẹp dữ liệu</label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          { value: "all", label: "Tất cả", desc: "Xóa toàn bộ", icon: CoinsIcon },
                          { value: "day", label: "Theo ngày", desc: "Chọn 1 ngày", icon: CalendarIcon },
                          { value: "month", label: "Theo tháng", desc: "Chọn 1 tháng", icon: CalendarIcon },
                          { value: "year", label: "Theo năm", desc: "Chọn 1 năm", icon: CalendarIcon },
                        ].map((item) => {
                          const Icon = item.icon;
                          const isSelected = resetRange === item.value;
                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setResetRange(item.value as "all" | "day" | "month" | "year")}
                              className={cn(
                                "flex flex-col items-center justify-center text-center p-3.5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden group select-none h-[92px]",
                                isSelected
                                  ? "border-destructive bg-destructive/5 text-destructive shadow-xs"
                                  : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-bl-sm" />
                              )}
                              <Icon className={cn("size-5 mb-2 transition-transform duration-300 group-hover:scale-110", isSelected ? "text-destructive" : "text-muted-foreground")} />
                              <span className="text-xs font-bold block">{item.label}</span>
                              <span className="text-[9px] text-muted-foreground/80 mt-0.5 block">{item.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Value Input (Conditional Picker Container) */}
                    {resetRange !== "all" && (
                      <div className="rounded-xl border border-border/60 bg-muted/10 p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-1.5 duration-200">
                        {resetRange === "day" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn ngày cụ thể</label>
                            <Input
                              type="date"
                              value={resetValue}
                              onChange={(e) => setResetValue(e.target.value)}
                              required
                              className="bg-background max-w-xs rounded-lg"
                            />
                          </div>
                        )}

                        {resetRange === "month" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn tháng cụ thể</label>
                            <Input
                              type="month"
                              value={resetValue}
                              onChange={(e) => setResetValue(e.target.value)}
                              required
                              className="bg-background max-w-xs rounded-lg"
                            />
                          </div>
                        )}

                        {resetRange === "year" && (
                          <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chọn năm cụ thể</label>
                            <select
                              value={resetValue}
                              onChange={(e) => setResetValue(e.target.value)}
                              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer max-w-xs"
                            >
                              {Array.from({ length: 6 }, (_, i) => {
                                const y = new Date().getFullYear() - i;
                                return (
                                  <option key={y} value={y}>
                                    Năm {y}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Keep balance switch (Modern colored container) */}
                    <div className={cn(
                      "flex items-center justify-between rounded-xl border p-4 transition-all duration-300",
                      keepBalance 
                        ? "border-emerald-500/20 bg-emerald-500/2" 
                        : "border-border bg-muted/20"
                    )}>
                      <div className="flex items-start gap-3 text-left">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-lg mt-0.5 shrink-0 transition-colors duration-300",
                          keepBalance ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        )}>
                          <CoinsIcon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Giữ nguyên số dư tài khoản</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-md">
                            {keepBalance 
                              ? "Bảo lưu số dư ví: Thích hợp khi hết năm và muốn dọn dẹp giao dịch để bắt đầu năm mới với số dư thực tế." 
                              : "Hoàn lại số dư theo giao dịch: Thích hợp khi bạn muốn xóa sạch dữ liệu chạy thử để đưa ví về 0."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={keepBalance}
                        onClick={() => setKeepBalance(!keepBalance)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          keepBalance ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                            keepBalance ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-3 border-t border-border/40 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setOpenResetDialog(true)}
                        className="font-semibold shadow-xs hover:shadow-md transition-all duration-300 rounded-xl h-10 px-5 gap-1.5 cursor-pointer"
                      >
                        <TrashIcon className="size-4" />
                        Tiến hành Reset Giao dịch
                      </Button>
                    </div>
                  </div>
                </section>
              </>
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

      {/* dialog 7: Reset Workspace Transactions Confirm */}
      <Dialog open={openResetDialog} onOpenChange={(open) => {
        setOpenResetDialog(open);
        if (!open) setConfirmKeyword("");
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-lg font-bold">
              <AlertTriangleIcon className="size-5 text-destructive animate-bounce" />
              Xác nhận xóa vĩnh viễn?
            </DialogTitle>
            <div className="space-y-4 pt-3 text-sm text-muted-foreground text-left">
              <div className="rounded-xl border border-destructive/20 bg-destructive/2 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Thông số Reset dữ liệu</p>
                <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-2 text-xs">
                  <span className="text-muted-foreground">Workspace:</span>
                  <span className="font-semibold text-foreground">{activeWorkspace?.name || "Cá nhân"}</span>
                  
                  <span className="text-muted-foreground">Phạm vi thời gian:</span>
                  <span className="font-semibold text-destructive">
                    {resetRange === "all" && "Toàn bộ lịch sử"}
                    {resetRange === "day" && `Ngày ${resetValue}`}
                    {resetRange === "month" && `Tháng ${resetValue}`}
                    {resetRange === "year" && `Năm ${resetValue}`}
                  </span>

                  <span className="text-muted-foreground">Trạng thái ví:</span>
                  <span className="font-semibold text-foreground">
                    {keepBalance ? "Giữ nguyên số dư hiện tại" : "Hoàn trả về 0 / ban đầu"}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cảnh báo: Hành động này sẽ dọn dẹp toàn bộ dữ liệu giao dịch đã chọn trong cơ sở dữ liệu. Tất cả hóa đơn, thu chi liên quan sẽ bị <span className="text-destructive font-bold">mất vĩnh viễn</span> và không có cách nào khôi phục.
              </p>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-foreground block">
                  Nhập chính xác <span className="text-destructive font-extrabold uppercase tracking-wide">XÓA VĨNH VIỄN</span> để xác nhận:
                </label>
                <Input
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="Gõ đúng từ khóa..."
                  className="border-destructive/30 focus-visible:ring-destructive rounded-lg h-9 text-sm"
                />
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 border-t border-border/50 pt-4 mt-2">
            <Button variant="outline" className="rounded-lg text-xs" onClick={() => setOpenResetDialog(false)} disabled={isResetting}>
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              className="rounded-lg text-xs font-semibold gap-1.5"
              onClick={handleResetTransactions}
              disabled={isResetting || confirmKeyword !== "XÓA VĨNH VIỄN"}
            >
              {isResetting && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
              Xác nhận xóa dữ liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivatePageShell>
  );
}
