/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { useAccounts } from "@/hooks/use-accounts";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CoinsIcon,
  SparklesIcon,
  Loader2Icon,
  CheckCircle2Icon,
  HelpCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import IconPreview from "@/components/icons/icon-preview";

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "@/lib/constants/default-categories";

const LOCAL_STORAGE_KEY = "money-setup-dismissed";

const ACCOUNT_PRESETS = [
  { name: "Tiền mặt", type: "cash", icon: "💵", color: "#10b981" },
  { name: "Tài khoản ngân hàng", type: "bank", icon: "🏦", color: "#3b82f6" },
  { name: "Quỹ chung nhóm", type: "cash", icon: "💰", color: "#f59e0b" },
];

function formatAmountInput(val: string | number): string {
  const str = String(val);
  const isNegative = str.startsWith("-");
  const clean = str.replace(/[^0-9]/g, "");
  if (!clean) return isNegative ? "-" : "";
  const formatted = Number(clean).toLocaleString("en-US");
  return isNegative ? `-${formatted}` : formatted;
}

export function WorkspaceSetupDialog() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const { user } = useAuth();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [dismissedList, setDismissedList] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form states cho Account
  const [accountName, setAccountName] = React.useState("");
  const [accountBalance, setAccountBalance] = React.useState("0");
  const [accountType, setAccountType] = React.useState("cash");
  const [accountIcon, setAccountIcon] = React.useState("💵");
  const [accountColor, setAccountColor] = React.useState("#10b981");

  // Selected Categories states
  const [selectedExpense, setSelectedExpense] = React.useState<string[]>(
    DEFAULT_EXPENSE_CATEGORIES.map((c) => c.name)
  );
  const [selectedIncome, setSelectedIncome] = React.useState<string[]>(
    DEFAULT_INCOME_CATEGORIES.map((c) => c.name)
  );

  const activeWorkspace = React.useMemo(() => {
    return user?.workspaces?.find((w) => w.id === activeWorkspaceId);
  }, [user?.workspaces, activeWorkspaceId]);

  // Đọc danh sách dismissed từ localStorage sau khi component mount
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setDismissedList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Lỗi đọc localStorage:", e);
    }
  }, []);

  // Thiết lập các giá trị mặc định cho Account dựa theo workspace hiện tại
  React.useEffect(() => {
    if (activeWorkspace) {
      if (activeWorkspace.is_personal) {
        setAccountName("Ví tiền mặt");
        setAccountIcon("💵");
        setAccountColor("#10b981");
        setAccountType("cash");
      } else {
        setAccountName("Quỹ chung");
        setAccountIcon("💰");
        setAccountColor("#f59e0b");
        setAccountType("cash");
      }
    }
  }, [activeWorkspace]);

  // Quản lý việc hiển thị Dialog
  React.useEffect(() => {
    if (!mounted || accountsLoading || !activeWorkspaceId) {
      setIsOpen(false);
      return;
    }

    // Chỉ hiện nếu:
    // 1. Workspace chưa có tài khoản nào
    // 2. Workspace_id này chưa từng bị tắt/cấu hình (không có trong dismissedList)
    const hasNoAccounts = accounts.length === 0;
    const isNotDismissed = !dismissedList.includes(activeWorkspaceId);

    setIsOpen(hasNoAccounts && isNotDismissed);
  }, [mounted, accounts, accountsLoading, activeWorkspaceId, dismissedList]);

  if (!mounted) return null;

  // Xử lý đóng Dialog và lưu vào localStorage để không hiện lại
  const handleDismiss = () => {
    if (!activeWorkspaceId) return;
    const nextList = [...dismissedList, activeWorkspaceId];
    setDismissedList(nextList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
    } catch (e) {
      console.error("Lỗi lưu localStorage:", e);
    }
    setIsOpen(false);
  };

  const handleToggleExpense = (name: string) => {
    setSelectedExpense((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleToggleIncome = (name: string) => {
    setSelectedIncome((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const applyPreset = (preset: typeof ACCOUNT_PRESETS[0]) => {
    setAccountName(preset.name);
    setAccountType(preset.type);
    setAccountIcon(preset.icon);
    setAccountColor(preset.color);
  };

  const handleSaveSetup = async () => {
    if (!activeWorkspaceId) return;
    if (!accountName.trim()) {
      toast.error("Vui lòng nhập tên tài khoản ban đầu");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Tạo tài khoản mặc định
      const numBalance = Number(accountBalance.replace(/[^0-9-]/g, "")) || 0;
      const accountRes = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          name: accountName.trim(),
          type: accountType,
          balance: numBalance,
          currency: "VND",
          icon: accountIcon,
          color: accountColor,
          is_active: true,
        }),
      });

      if (!accountRes.ok) {
        const errJson = await accountRes.json();
        throw new Error(errJson.message || "Tạo tài khoản thất bại");
      }

      // 2. Lọc danh sách danh mục được chọn
      const categoriesToCreate = [
        ...DEFAULT_EXPENSE_CATEGORIES.filter((c) => selectedExpense.includes(c.name)),
        ...DEFAULT_INCOME_CATEGORIES.filter((c) => selectedIncome.includes(c.name)),
      ].map((c) => ({
        workspace_id: activeWorkspaceId,
        name: c.name,
        icon: c.icon,
        type: c.type,
      }));

      // 3. Gọi API bulk insert categories
      if (categoriesToCreate.length > 0) {
        const categoryRes = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(categoriesToCreate),
        });

        if (!categoryRes.ok) {
          const errJson = await categoryRes.json();
          throw new Error(errJson.error || "Tạo danh mục mẫu thất bại");
        }
      }

      // 4. Invalidate queries & đóng popup
      toast.success("Thiết lập workspace thành công!");
      queryClient.invalidateQueries({ queryKey: ["accounts", activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["categories", activeWorkspaceId] });

      // Lưu dismissed để không bao giờ hiển thị lại
      handleDismiss();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent fullScreenOnMobile className="sm:max-w-2xl sm:max-h-[90vh] sm:rounded-2xl shadow-xl">
        {/* Header với hiệu ứng gradient đẹp mắt */}
        <div className="relative p-6 pb-4 border-b border-border bg-linear-to-r from-primary/5 via-transparent to-transparent">
          <div className="pointer-events-none absolute inset-x-0 -top-6 h-20 bg-linear-to-b from-primary/8 to-transparent blur-xl" />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary animate-pulse">
                <SparklesIcon className="size-4" />
              </span>
              Cấu hình tài chính ban đầu
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              {activeWorkspace?.is_personal
                ? "Thiết lập nhanh ví tiền ban đầu và các danh mục thu chi cá nhân cho riêng bạn."
                : `Chào mừng bạn đến với nhóm "${activeWorkspace?.name}". Cấu hình tài khoản quỹ và các danh mục thu chi chung cho nhóm.`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Nội dung Form cuộn mượt mà */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Phần 1: Tạo tài khoản đầu tiên */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
              <CoinsIcon className="size-4 text-primary" />
              1. Tạo tài khoản tiền đầu tiên
            </h3>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="rounded-full h-8 text-xs font-normal bg-card hover:bg-muted cursor-pointer"
                >
                  <span className="mr-1">{preset.icon}</span>
                  {preset.name}
                </Button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 border border-border/60 rounded-xl p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Tên tài khoản</Label>
                <div className="flex gap-2">
                  <Input
                    value={accountIcon}
                    onChange={(e) => setAccountIcon(e.target.value)}
                    placeholder="💵"
                    className="w-12 text-center text-lg p-0 h-10 rounded-lg shrink-0"
                  />
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ví dụ: Ví cá nhân, Quỹ chung..."
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Số dư ban đầu</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    ₫
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="h-10 rounded-lg text-sm pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Loại tài khoản</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger className="w-full h-10 rounded-lg border-input bg-background text-sm">
                    <SelectValue placeholder="Chọn loại tài khoản" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt (Cash)</SelectItem>
                    <SelectItem value="bank">Tài khoản ngân hàng (Bank)</SelectItem>
                    <SelectItem value="credit">Thẻ tín dụng (Credit Card)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Màu chủ đạo tài khoản</Label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    aria-label="Chọn màu tài khoản"
                    type="color"
                    value={accountColor}
                    onChange={(e) => setAccountColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-1"
                  />
                  <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded-lg border border-border/50">
                    {accountColor}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Phần 2: Chọn danh mục mẫu */}
          <div className="space-y-4 pt-2 border-t border-border/80">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <CheckCircle2Icon className="size-4 text-primary" />
                2. Áp dụng danh mục mẫu
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <HelpCircleIcon className="size-3" /> Click để chọn/hủy chọn
              </span>
            </div>

            {/* Chi tiêu */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-rose-500 block uppercase tracking-wider">
                Mẫu Chi tiêu (Expenses)
              </Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_EXPENSE_CATEGORIES.map((c) => {
                  const isSelected = selectedExpense.includes(c.name);
                  return (
                    <Button
                      key={c.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleExpense(c.name)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <IconPreview name={c.icon} className="size-3.5" />
                      <span>{c.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Thu nhập */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-bold text-emerald-500 block uppercase tracking-wider">
                Mẫu Thu nhập (Income)
              </Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_INCOME_CATEGORIES.map((c) => {
                  const isSelected = selectedIncome.includes(c.name);
                  return (
                    <Button
                      key={c.name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleIncome(c.name)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 h-8 text-xs border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <IconPreview name={c.icon} className="size-3.5" />
                      <span>{c.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-muted/10 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="text-xs rounded-xl w-full sm:w-auto"
            type="button"
          >
            Để sau (Bỏ qua)
          </Button>
          <Button
            onClick={handleSaveSetup}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold px-5 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 w-full sm:w-auto"
            type="button"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />
                Đang thiết lập...
              </>
            ) : (
              "Hoàn tất thiết lập"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
