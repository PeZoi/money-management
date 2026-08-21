"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cloud,
  Coins,
  Eye,
  EyeOff,
  FolderArchive,
  HardDrive,
  Loader2,
  Maximize2,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import {
  AdminSettingsData,
  CloudinaryProfile,
  useCloudinaryUsage,
  useTestCloudinaryConnection,
} from "../hooks/use-admin-settings";

interface CloudinarySettingsTabProps {
  settings: AdminSettingsData["cloudinary"] | undefined;
  isLoading: boolean;
  profiles: CloudinaryProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<CloudinaryProfile[]>>;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  selectedProfileId: string;
  setSelectedProfileId: (id: string) => void;
}

export default function CloudinarySettingsTab({
  settings,
  isLoading,
  profiles,
  setProfiles,
  activeProfileId,
  setActiveProfileId,
  selectedProfileId,
  setSelectedProfileId,
}: CloudinarySettingsTabProps) {
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const testMutation = useTestCloudinaryConnection();
  const usageMutation = useCloudinaryUsage();

  // Profile đang được click chọn để xem / chỉnh sửa
  const currentProfile =
    profiles.find((p) => p.id === selectedProfileId) || profiles[0];

  const updateCurrentField = (
    field: keyof Pick<CloudinaryProfile, "name" | "cloudName" | "apiKey" | "apiSecret">,
    val: string
  ) => {
    if (!currentProfile) return;
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, [field]: val } : p))
    );
  };

  const handleAddProfile = () => {
    const newId = `profile-${Date.now()}`;
    const newProfile: CloudinaryProfile = {
      id: newId,
      name: `Tài khoản ${profiles.length + 1}`,
      cloudName: "",
      apiKey: "",
      apiSecret: "",
      apiKeyMasked: "",
      apiSecretMasked: "",
      hasApiKey: false,
      hasApiSecret: false,
      isFromEnv: false,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setSelectedProfileId(newId);
    toast.info("Đã tạo profile mới. Vui lòng nhập thông tin Cloudinary.");
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      toast.error("Hệ thống cần ít nhất 1 profile Cloudinary.");
      return;
    }
    const filtered = profiles.filter((p) => p.id !== id);
    setProfiles(filtered);
    if (selectedProfileId === id) {
      setSelectedProfileId(filtered[0].id);
    }
    if (activeProfileId === id) {
      setActiveProfileId(filtered[0].id);
    }
    toast.success("Đã xóa profile.");
  };

  const handleTestConnection = async () => {
    if (!currentProfile) return;
    try {
      const res = await testMutation.mutateAsync({
        cloudName: currentProfile.cloudName,
        apiKey: currentProfile.apiKey,
        apiSecret: currentProfile.apiSecret,
      });
      toast.success(
        res.message || `Kiểm tra [${currentProfile.name}] thành công!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kiểm tra thất bại";
      toast.error(msg);
    }
  };

  const handleFetchUsage = async () => {
    if (!currentProfile) return;
    try {
      await usageMutation.mutateAsync({
        cloudName: currentProfile.cloudName,
        apiKey: currentProfile.apiKey,
        apiSecret: currentProfile.apiSecret,
      });
      toast.success(`Đã lấy thông tin dung lượng cho [${currentProfile.name}]!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể lấy dung lượng";
      toast.error(msg);
    }
  };

  const activeProfileSaved = settings?.profiles?.find(
    (p) => p.id === (settings?.activeProfileId || "default")
  );

  const usageData = usageMutation.data?.data;

  return (
    <div className="space-y-6">
      {/* 1. Danh sách Profile Cloudinary (Multi-Profile Cards) */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Cloud className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">
                Hệ thống Đa Tài Khoản Cloudinary (Multi-Profile)
              </h3>
              <p className="text-xs text-muted-foreground">
                Quản lý nhiều tài khoản Cloudinary. Khi một tài khoản đầy, bạn có thể dễ dàng chuyển sang tài khoản khác chỉ với 1 click.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="w-fit bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs"
            >
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Đang dùng: {activeProfileSaved?.name || "Tài khoản chính"}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProfile}
              className="h-8 gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10"
            >
              <Plus className="size-3.5" />
              Thêm Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {profiles.map((p) => {
            const isEditing = currentProfile?.id === p.id;
            const isSavedActive = (settings?.activeProfileId || "default") === p.id;
            const isPendingActive = activeProfileId === p.id;
            const hasCredentials = Boolean(p.apiKey || p.hasApiKey);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProfileId(p.id)}
                className={`relative flex flex-col justify-between items-start text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer min-h-[105px] group ${
                  isEditing
                    ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/40"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-2">
                    <Cloud className="size-4 text-primary shrink-0" />
                    <span className="font-semibold text-sm text-foreground truncate">
                      {p.name || "Tài khoản Cloudinary"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSavedActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 shadow-xs">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang sử dụng
                      </span>
                    ) : isPendingActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold border border-primary/30">
                        <CheckCircle2 className="size-3" />
                        Sẽ dùng khi Lưu
                      </span>
                    ) : hasCredentials ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                        Đã có key
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/60 text-[10px]">
                        Chưa cấu hình
                      </span>
                    )}

                    {profiles.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProfile(e, p.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all ml-1"
                        title="Xóa Profile này"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span className="font-mono text-[11px] truncate">
                    {p.cloudName ? `Cloud: ${p.cloudName}` : "Chưa nhập Cloud Name"}
                  </span>
                  {isEditing && (
                    <span className="text-[10px] text-primary font-medium shrink-0 ml-1">
                      Đang chỉnh sửa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Chi tiết Cấu hình cho Profile đang chọn */}
      {currentProfile && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <Cloud className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-base">
                  Cấu hình cho {currentProfile.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Thông tin xác thực API và lưu trữ hình ảnh/video cho {currentProfile.name}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(settings?.activeProfileId || "default") === currentProfile.id &&
              activeProfileId === currentProfile.id ? (
                <Badge
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1.5 py-1 px-2.5 font-medium text-xs"
                >
                  <span className="size-2 rounded-full bg-white animate-pulse" />
                  Tài khoản chính đang chạy
                </Badge>
              ) : activeProfileId === currentProfile.id ? (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="gap-1 bg-primary text-primary-foreground py-1 px-2.5 text-xs"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Đã chọn làm chính (Nhấn &quot;Lưu tất cả&quot; để áp dụng)
                  </Badge>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setActiveProfileId(settings?.activeProfileId || "default")
                    }
                  >
                    Hủy chọn
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-xs font-medium text-xs"
                  onClick={() => setActiveProfileId(currentProfile.id)}
                >
                  <CheckCircle2 className="size-4" />
                  Kích hoạt {currentProfile.name} làm chính
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Tên Profile */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Tên Gợi Nhớ Profile
              </label>
              <Input
                value={currentProfile.name}
                onChange={(e) => updateCurrentField("name", e.target.value)}
                placeholder="Ví dụ: Tài khoản chính, Tài khoản 2026, Account Backup..."
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Đặt tên mô tả để dễ nhận biết tài khoản nào đang được sử dụng lưu trữ cho giai đoạn/dự án nào.
              </p>
            </div>

            {/* Cloud Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Cloud Name (CLOUDINARY_CLOUD_NAME)
                </label>
                {currentProfile.isFromEnv && (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-normal text-muted-foreground"
                  >
                    Đang dùng từ .env
                  </Badge>
                )}
              </div>
              <Input
                value={currentProfile.cloudName}
                onChange={(e) => updateCurrentField("cloudName", e.target.value)}
                placeholder="Ví dụ: dz8vpmcub"
                className="h-10 font-mono text-sm"
              />
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                API Key (CLOUDINARY_API_KEY)
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showKey ? "text" : "password"}
                  value={currentProfile.apiKey || ""}
                  onChange={(e) => updateCurrentField("apiKey", e.target.value)}
                  placeholder={
                    currentProfile.hasApiKey
                      ? `Đã cấu hình (${currentProfile.apiKeyMasked}) - Nhập để thay đổi`
                      : "Nhập Cloudinary API Key..."
                  }
                  className="h-10 pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                  title={showKey ? "Ẩn" : "Hiện"}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* API Secret */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                API Secret (CLOUDINARY_API_SECRET)
              </label>
              <div className="relative flex items-center">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={currentProfile.apiSecret || ""}
                  onChange={(e) =>
                    updateCurrentField("apiSecret", e.target.value)
                  }
                  placeholder={
                    currentProfile.hasApiSecret
                      ? `Đã cấu hình (${currentProfile.apiSecretMasked}) - Nhập để thay đổi`
                      : "Nhập Cloudinary API Secret..."
                  }
                  className="h-10 pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
                  title={showSecret ? "Ẩn" : "Hiện"}
                >
                  {showSecret ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                API Secret dùng để ký tạo chữ ký upload an toàn phía server. Khóa này được mã hóa bảo mật.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Thao tác & Kiểm tra kết nối / Tra cứu dung lượng */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
            <Zap className="size-4 text-primary" />
            Kiểm tra & Tra cứu thông tin {currentProfile?.name || "Cloudinary"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kiểm tra kết nối hoặc tra cứu chi tiết dung lượng đã dùng, còn trống, băng thông và hạn mức của tài khoản này.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testMutation.isPending || isLoading}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
          >
            {testMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Đang ping...</span>
              </>
            ) : (
              <>
                <Zap className="size-3.5 text-primary" />
                <span>Kiểm tra kết nối</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            onClick={handleFetchUsage}
            disabled={usageMutation.isPending || isLoading}
            className="gap-2 text-xs shadow-xs"
          >
            {usageMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang tải dung lượng...</span>
              </>
            ) : (
              <>
                <BarChart3 className="size-3.5" />
                <span>Tra cứu dung lượng</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Kết quả Test Ping Connection */}
      {testMutation.data && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            <span>{testMutation.data.message}</span>
          </div>
        </div>
      )}

      {testMutation.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-1 text-destructive text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="size-4" />
            Lỗi khi kiểm tra kết nối Cloudinary:
          </div>
          <p className="font-mono">{testMutation.error?.message}</p>
        </div>
      )}

      {/* 4. Dashboard Báo Cáo Dung Lượng (Usage Dashboard) */}
      {usageData && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in-50 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="size-4" />
              </span>
              <h4 className="font-semibold text-sm">
                Báo cáo Dung Lượng & Tài Nguyên ({currentProfile?.name})
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="border-primary/40 text-primary font-mono">
                Gói: {usageData.plan}
              </Badge>
              <span className="text-muted-foreground text-[11px]">
                Cập nhật: {usageData.lastUpdated}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Dung lượng lưu trữ (Storage) */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <HardDrive className="size-4 text-primary" />
                  Dung Lượng Lưu Trữ
                </span>
                <span className={`text-xs font-semibold font-mono ${
                  usageData.storage.usedPercent > 85
                    ? "text-destructive"
                    : usageData.storage.usedPercent > 70
                    ? "text-amber-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {usageData.storage.usedPercent}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-bold font-mono text-foreground">
                    {usageData.storage.usageFormatted}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    / {usageData.storage.limitFormatted}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usageData.storage.usedPercent > 85
                        ? "bg-destructive"
                        : usageData.storage.usedPercent > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, usageData.storage.usedPercent))}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/30">
                <span>Còn trống:</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {usageData.storage.freeFormatted}
                </span>
              </div>
            </div>

            {/* Card 2: Băng thông (Bandwidth) */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="size-4 text-primary" />
                  Băng Thông Đã Dùng
                </span>
                <span className="text-xs font-semibold font-mono text-primary">
                  {usageData.bandwidth.usedPercent}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-lg font-bold font-mono text-foreground">
                    {usageData.bandwidth.usageFormatted}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    / {usageData.bandwidth.limitFormatted}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, usageData.bandwidth.usedPercent))}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/30">
                <span>Số tệp đang lưu:</span>
                <span className="font-mono font-medium text-foreground">
                  {usageData.resourcesCount.toLocaleString()} files
                </span>
              </div>
            </div>

            {/* Card 3: Biến đổi ảnh & Giới hạn */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FolderArchive className="size-4 text-primary" />
                  Biến Đổi & Tài Nguyên
                </span>
                {usageData.credits ? (
                  <Badge variant="outline" className="text-[10px] font-mono gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400">
                    <Coins className="size-3" />
                    {usageData.credits.usage} / {usageData.credits.limit || "∞"} Credits
                  </Badge>
                ) : (
                  <span className="text-xs font-mono text-muted-foreground">
                    {usageData.transformations.usage.toLocaleString()} lượt
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Transformations:</span>
                  <span className="font-mono font-medium text-foreground">
                    {usageData.transformations.usage.toLocaleString()}{" "}
                    {usageData.transformations.limit ? `/ ${usageData.transformations.limit.toLocaleString()}` : ""}
                  </span>
                </div>
                {usageData.mediaLimits && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="size-3" />
                        Ảnh tối đa:
                      </span>
                      <span className="font-mono text-foreground font-medium">
                        {usageData.mediaLimits.imageMaxSizeFormatted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Maximize2 className="size-3" />
                        Video tối đa:
                      </span>
                      <span className="font-mono text-foreground font-medium">
                        {usageData.mediaLimits.videoMaxSizeFormatted}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/30 flex items-center justify-between">
                <span>Trạng thái tài khoản:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Hoạt động tốt
                </span>
              </div>
            </div>
          </div>

          {usageData.credits && (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coins className="size-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Cơ chế Credits dùng chung của Cloudinary:</strong> 1 Credit = 1 GB Lưu trữ = 1 GB Băng thông = 1.000 Lượt biến đổi ảnh.
                </span>
              </div>
              <span className="shrink-0 font-mono font-medium text-foreground">
                Tổng hạn mức: {usageData.credits.limit || 25} Credits / tháng
              </span>
            </div>
          )}
        </div>
      )}

      {usageMutation.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-1 text-destructive text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="size-4" />
            Lỗi khi tra cứu dung lượng Cloudinary:
          </div>
          <p className="font-mono">{usageMutation.error?.message}</p>
        </div>
      )}
    </div>
  );
}
