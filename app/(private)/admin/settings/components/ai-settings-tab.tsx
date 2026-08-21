"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AI_PROVIDER_PRESETS,
  type AIProvider,
} from "@/types/ai-providers";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AdminSettingsData,
  useTestAIConnection,
} from "../hooks/use-admin-settings";

interface AISettingsTabProps {
  settings: AdminSettingsData["ai"] | undefined;
  isLoading: boolean;
  activeProvider: AIProvider;
  setActiveProvider: (p: AIProvider) => void;
  selectedProvider: AIProvider;
  setSelectedProvider: (p: AIProvider) => void;
  providersState: Record<
    AIProvider,
    { apiKey: string; model: string; baseUrl: string }
  >;
  setProviderField: (
    prov: AIProvider,
    field: "apiKey" | "model" | "baseUrl",
    val: string
  ) => void;
}

function ProviderLogo({ provider }: { provider: AIProvider }) {
  switch (provider) {
    case "groq":
      return (
        <svg
          viewBox="0 0 1981.58 562.32"
          className="h-5 w-auto max-w-[80px] fill-current text-foreground shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1378.01.31h-.04c-109.6 0-198.78 89.18-198.78 198.78s89.18 198.78 198.78 198.78 198.78-89.18 198.78-198.81C1576.56 89.66 1487.4.5 1378.01.31m93.33 198.78c0 51.49-41.88 93.36-93.36 93.36s-93.36-41.88-93.36-93.36 41.88-93.36 93.36-93.36 93.36 41.87 93.36 93.36M908.86 180.75c.43-11.74 1.43-23.13 3.67-34.68l.05-.23c2.83-13.62 7.15-26.73 12.81-38.99 11.8-25.1 29.21-47.21 50.41-64.03 20.78-16.39 45.11-28.6 70.38-35.33 12.4-3.45 25.23-5.67 38.18-6.6 28.63-2.05 56.94 1.15 83.9 11.24 9.98 3.74 19.95 8.47 29.26 13.87l15.78 9.17-50.61 88.04-15.8-8.8c-10.95-6.1-22.78-9.84-35.16-11.11-12.97-1.17-26.36 0-38.93 3.43-11.9 3.18-23.24 8.94-32.86 16.64-9 7.25-16.26 16.51-20.96 26.71-5.08 11.01-6.98 23.13-6.98 35.17v199.17H908.85V180.75ZM873.03 187.44c-1.25-50.37-21.77-97.51-57.79-132.72C779.25 19.54 731.74.1 681.47 0h-1.63C574.85 0 488.97 85.15 488.05 190.59c-.45 51.35 19.07 99.82 54.95 136.49 35.9 36.68 83.86 57.12 135.2 57.57h58.51V282.78h-55.55c-24.09.33-46.84-8.87-64.06-25.73-17.24-16.87-26.88-39.48-27.14-63.68-.55-49.87 39.38-90.9 89.04-91.5h2.39c49.58 0 90.14 40.58 90.42 90.37v177.83c0 49.22-40.06 89.74-89.31 90.37-23.59-.18-45.76-9.55-62.43-26.43l-12.93-13.07-.05.05-51.98 91.8c34.69 31.66 79.12 49.17 126.28 49.52h2.59c50.55-.72 97.97-20.94 133.54-56.97 35.54-36.02 55.27-83.78 55.53-134.6V187.46H873v-.02ZM1790.21.29c-51.34 0-99.58 20.01-135.85 56.38-36.21 36.3-56.11 84.53-56.01 135.76 0 105.86 86.07 191.97 191.87 191.97h54.41V282.67h-54.41c-49.74 0-90.19-40.48-90.19-90.24s40.45-90.24 90.19-90.24c22.6 0 44.23 8.44 60.92 23.76 16.11 14.8 28.77 34.62 28.77 56.46v367.66h101.67V192.43c0-105.94-85.85-192.14-191.37-192.14M165.98 342.21H0L272.4 1.5l-68.75 220.11H369.6L97.23 562.32z" />
        </svg>
      );
    case "openrouter":
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="https://openrouter.ai/brand/v2/nav-lockup-light.png"
          alt="OpenRouter"
          className="h-5 w-auto max-w-[100px] object-contain dark:invert shrink-0"
        />
      );
    case "orcarouter":
      return (
        <span className="inline-flex items-center gap-1.5 h-5 leading-none shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://orcarouter.ai/orca-logo-classic.png"
            alt="OrcaRouter"
            className="h-5 w-auto object-contain shrink-0"
          />
          <span className="font-semibold text-[15px] tracking-tight text-foreground whitespace-nowrap">
            Orca<span className="text-[#2e7cf6]">Router</span>
          </span>
        </span>
      );
    default:
      return null;
  }
}

export default function AISettingsTab({
  settings,
  isLoading,
  activeProvider,
  setActiveProvider,
  selectedProvider,
  setSelectedProvider,
  providersState,
  setProviderField,
}: AISettingsTabProps) {
  const [showKey, setShowKey] = useState(false);
  const testMutation = useTestAIConnection();

  const currentPreset = AI_PROVIDER_PRESETS[selectedProvider] || AI_PROVIDER_PRESETS.groq;
  const savedProviderInfo = settings?.providers?.[selectedProvider];

  const currentApiKey = providersState[selectedProvider]?.apiKey ?? "";
  const currentModel = providersState[selectedProvider]?.model ?? "";
  const currentBaseUrl = providersState[selectedProvider]?.baseUrl ?? "";

  const handleTestConnection = async () => {
    try {
      const res = await testMutation.mutateAsync({
        provider: selectedProvider,
        apiKey: currentApiKey,
        model: currentModel,
        baseUrl: currentBaseUrl,
      });
      toast.success(
        `Kiểm tra [${currentPreset.name}] thành công (${res.latencyMs}ms): "${res.reply}"`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kiểm tra thất bại";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Chọn Nhà Cung Cấp AI */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Bot className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base">Cấu hình Đa Nhà Cung Cấp (Multi-Provider)</h3>
              <p className="text-xs text-muted-foreground">
                Mỗi nhà cung cấp được lưu cấu hình riêng. Chọn thẻ để chỉnh sửa và nhấn nút Kích hoạt khi muốn đổi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="w-fit bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs"
            >
              <span className="size-1.5 rounded-full bg-white animate-pulse" />
              Đang dùng: {AI_PROVIDER_PRESETS[settings?.activeProvider || "groq"]?.name || "Groq Cloud"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.keys(AI_PROVIDER_PRESETS) as AIProvider[]).map((key) => {
            const isEditing = selectedProvider === key;
            const isSavedActive = (settings?.activeProvider || "groq") === key;
            const isPendingActive = activeProvider === key;
            const keySaved = settings?.providers?.[key];
            const hasLocalKey = Boolean(providersState[key]?.apiKey);
            const providerHasKey = hasLocalKey || Boolean(keySaved?.hasApiKey);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedProvider(key)}
                className={`relative flex flex-col justify-between items-start text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer min-h-[96px] ${
                  isEditing
                    ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/40"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="h-6 flex items-center">
                    <ProviderLogo provider={key} />
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
                    ) : providerHasKey ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                        Đã có key
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground/60 text-[10px]">
                        Chưa có key
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span className="truncate">
                    {key === "groq"
                      ? "Groq Cloud (Siêu nhanh)"
                      : key === "openrouter"
                      ? "OpenRouter (200+ Models)"
                      : "OrcaRouter (Adaptive Gateway)"}
                  </span>
                  {isEditing && (
                    <span className="text-[10px] text-primary font-medium shrink-0 ml-1">
                      Đang chỉnh sửa
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cấu hình Model & Base URL cho Provider được chọn */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <span>Cấu hình cho {currentPreset.name}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Tùy chỉnh Model và Endpoint API riêng cho {currentPreset.name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {settings?.activeProvider === selectedProvider && activeProvider === selectedProvider ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1.5 py-1 px-2.5 font-medium text-xs">
                <span className="size-2 rounded-full bg-white animate-pulse" />
                Nhà cung cấp chính đang chạy
              </Badge>
            ) : activeProvider === selectedProvider ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1 bg-primary text-primary-foreground py-1 px-2.5 text-xs">
                  <CheckCircle2 className="size-3.5" />
                  Đã chọn làm chính (Nhấn &quot;Lưu tất cả&quot; để áp dụng)
                </Badge>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setActiveProvider(settings?.activeProvider || "groq")}
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
                onClick={() => setActiveProvider(selectedProvider)}
              >
                <CheckCircle2 className="size-4" />
                Kích hoạt {currentPreset.name.split(" ")[0]} làm chính
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Input Model Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tên Model (AI_MODEL)</label>
              {currentModel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setProviderField(selectedProvider, "model", "")}
                  className="text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <RefreshCw className="size-3" />
                  Xóa
                </Button>
              )}
            </div>
            <Input
              value={currentModel}
              onChange={(e) => setProviderField(selectedProvider, "model", e.target.value)}
              placeholder={
                selectedProvider === "openrouter"
                  ? "Ví dụ: deepseek/deepseek-chat, openai/gpt-4o-mini..."
                  : selectedProvider === "orcarouter"
                  ? "Ví dụ: orcarouter/auto, openai/gpt-4o-mini..."
                  : "Ví dụ: llama-3.3-70b-versatile, mixtral-8x7b-32768..."
              }
              className="h-10 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              {selectedProvider === "openrouter"
                ? "Trên OpenRouter, tên model có dạng vendor/model (ví dụ: deepseek/deepseek-chat). Để trống sẽ dùng mặc định."
                : "Nhập mã định danh model do nhà cung cấp AI hỗ trợ (để trống sẽ tự động dùng model tối ưu của nhà cung cấp)."}
            </p>
          </div>

          {/* Input Base URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Server className="size-4 text-muted-foreground" />
                <span>Base URL (Endpoint API)</span>
              </label>
              {currentBaseUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setProviderField(selectedProvider, "baseUrl", "")}
                  className="text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <RefreshCw className="size-3" />
                  Xóa
                </Button>
              )}
            </div>
            <Input
              value={currentBaseUrl}
              onChange={(e) => setProviderField(selectedProvider, "baseUrl", e.target.value)}
              placeholder={
                selectedProvider === "openrouter"
                  ? "https://openrouter.ai/api/v1"
                  : selectedProvider === "orcarouter"
                  ? "https://api.orcarouter.ai/v1"
                  : "https://api.groq.com/openai/v1"
              }
              className="h-10 font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Endpoint gốc chuẩn OpenAI (để trống sẽ tự động dùng endpoint chính thức của {currentPreset.name}).
            </p>
          </div>
        </div>
      </div>

      {/* 3. API Key & Bảo mật cho Provider được chọn */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-border/40">
          <span className="p-2 rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-base">API Key ({currentPreset.name})</h3>
            <p className="text-xs text-muted-foreground">
              Khóa xác thực API riêng của {currentPreset.name}. Được lưu trữ bảo mật trên cơ sở dữ liệu.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>Khóa API ({currentPreset.envKey})</span>
              {savedProviderInfo?.isKeyFromEnv && (
                <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                  Đang dùng key từ .env
                </Badge>
              )}
            </label>
            <div className="relative flex items-center">
              <Input
                type={showKey ? "text" : "password"}
                value={currentApiKey}
                onChange={(e) => setProviderField(selectedProvider, "apiKey", e.target.value)}
                placeholder={
                  savedProviderInfo?.hasApiKey
                    ? `Đã lưu key (${savedProviderInfo.apiKeyMasked}) - Nhập để thay đổi`
                    : `Nhập API Key cho ${currentPreset.name.split(" ")[0]}...`
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
        </div>
      </div>

      {/* 4. Thử nghiệm kết nối (Test AI) */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-medium text-sm flex items-center gap-2 text-foreground">
            <Zap className="size-4 text-primary" />
            Kiểm tra kết nối {currentPreset.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gửi yêu cầu ping kiểm tra xem API Key, Base URL và Model của {currentPreset.name} có hoạt động chính xác không trước khi lưu.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={testMutation.isPending || isLoading}
          className="shrink-0 gap-2 border-primary/30 hover:bg-primary/10"
        >
          {testMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Đang kiểm tra...</span>
            </>
          ) : (
            <>
              <Zap className="size-4 text-primary" />
              <span>Kiểm tra kết nối {currentPreset.name.split(" ")[0]}</span>
            </>
          )}
        </Button>
      </div>

      {/* Kết quả Test Connection */}
      {testMutation.data && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" />
              Kết nối [{testMutation.data.provider.toUpperCase()}] thành công!
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[11px] font-mono"
              >
                Model: {testMutation.data.model || "Tự động"}
              </Badge>
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-500/40 text-[11px]"
              >
                ⚡ {testMutation.data.latencyMs}ms
              </Badge>
            </div>
          </div>
          <div className="p-3 bg-background/80 rounded-lg border border-border/50 space-y-1">
            <div className="text-[11px] font-medium text-muted-foreground">
              Phản hồi xác nhận từ AI:
            </div>
            <p className="text-xs text-foreground/90 font-mono italic leading-relaxed">
              &quot;{testMutation.data.reply}&quot;
            </p>
          </div>
        </div>
      )}

      {testMutation.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 space-y-1 text-destructive text-xs">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="size-4" />
            Lỗi khi kiểm tra kết nối AI:
          </div>
          <p className="font-mono">{testMutation.error?.message}</p>
        </div>
      )}
    </div>
  );
}
