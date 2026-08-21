"use client";

import { PrivatePageShell } from "@/components/private-page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AIProvider } from "@/types/ai-providers";
import {
  Bot,
  Cloud,
  Loader2,
  RefreshCw,
  Save,
  Sliders,
} from "lucide-react";
import { useState } from "react";
import AISettingsTab from "./components/ai-settings-tab";
import CloudinarySettingsTab from "./components/cloudinary-settings-tab";
import {
  AdminSettingsData,
  CloudinaryProfile,
  useAdminSettings,
  useUpdateAdminSettings,
} from "./hooks/use-admin-settings";

interface SettingsFormProps {
  settings: AdminSettingsData;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

function SettingsForm({
  settings,
  isLoading,
  isFetching,
  onRefresh,
}: SettingsFormProps) {
  const updateMutation = useUpdateAdminSettings();

  // Provider đang được kích hoạt làm mặc định hệ thống
  const [activeProvider, setActiveProvider] = useState<AIProvider>(
    settings.ai.activeProvider || settings.ai.provider || "groq"
  );
  // Provider đang được chọn để xem/sửa cấu hình trên tab AI
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    settings.ai.activeProvider || settings.ai.provider || "groq"
  );

  // State cấu hình riêng cho từng Provider (Nạp sẵn key, model, baseUrl đã lưu)
  const [providersState, setProvidersState] = useState<
    Record<AIProvider, { apiKey: string; model: string; baseUrl: string }>
  >({
    groq: {
      apiKey: settings.ai.providers?.groq?.apiKey || "",
      model: settings.ai.providers?.groq?.model || "",
      baseUrl: settings.ai.providers?.groq?.baseUrl || "",
    },
    openrouter: {
      apiKey: settings.ai.providers?.openrouter?.apiKey || "",
      model: settings.ai.providers?.openrouter?.model || "",
      baseUrl: settings.ai.providers?.openrouter?.baseUrl || "",
    },
    orcarouter: {
      apiKey: settings.ai.providers?.orcarouter?.apiKey || "",
      model: settings.ai.providers?.orcarouter?.model || "",
      baseUrl: settings.ai.providers?.orcarouter?.baseUrl || "",
    },
  });

  // State cấu hình Đa Profile Cloudinary
  const initialCloudinaryProfiles: CloudinaryProfile[] =
    settings.cloudinary.profiles?.length
      ? settings.cloudinary.profiles
      : [
          {
            id: "default",
            name: "Tài khoản chính",
            cloudName: settings.cloudinary.cloudName || "",
            apiKey: settings.cloudinary.apiKey || "",
            apiSecret: settings.cloudinary.apiSecret || "",
            apiKeyMasked: settings.cloudinary.apiKeyMasked || "",
            apiSecretMasked: settings.cloudinary.apiSecretMasked || "",
            hasApiKey: settings.cloudinary.hasApiKey || false,
            hasApiSecret: settings.cloudinary.hasApiSecret || false,
            isFromEnv: settings.cloudinary.isFromEnv || false,
          },
        ];

  const [cloudinaryProfiles, setCloudinaryProfiles] = useState<CloudinaryProfile[]>(
    initialCloudinaryProfiles
  );
  const [activeCloudProfileId, setActiveCloudProfileId] = useState<string>(
    settings.cloudinary.activeProfileId || initialCloudinaryProfiles[0]?.id || "default"
  );
  const [selectedCloudProfileId, setSelectedCloudProfileId] = useState<string>(
    settings.cloudinary.activeProfileId || initialCloudinaryProfiles[0]?.id || "default"
  );

  const setProviderField = (
    prov: AIProvider,
    field: "apiKey" | "model" | "baseUrl",
    val: string
  ) => {
    setProvidersState((prev) => ({
      ...prev,
      [prov]: {
        ...prev[prov],
        [field]: val,
      },
    }));
  };

  const handleSaveAll = async () => {
    await updateMutation.mutateAsync({
      ai: {
        activeProvider,
        providers: providersState,
      },
      cloudinary: {
        activeProfileId: activeCloudProfileId,
        profiles: cloudinaryProfiles.map((p) => ({
          id: p.id,
          name: p.name,
          cloudName: p.cloudName,
          apiKey: p.apiKey,
          apiSecret: p.apiSecret,
        })),
      },
    });
  };

  return (
    <PrivatePageShell
      title="Cấu hình Hệ thống"
      description="Quản lý động các thông số API AI (Groq, OpenRouter, Gemini, OpenAI) và dịch vụ lưu trữ hình ảnh Cloudinary."
      icon={Sliders}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isFetching}
            title="Tải lại cài đặt"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>

          <Button
            onClick={handleSaveAll}
            disabled={updateMutation.isPending || isLoading}
            className="gap-2 shadow-sm font-medium"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="size-4" />
                <span>Lưu tất cả thay đổi</span>
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="mt-6">
        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-muted/40 backdrop-blur-xs border border-border/50">
            <TabsTrigger value="ai" className="gap-2 font-medium">
              <Bot className="size-4" />
              <span>Trợ lý AI (Đa Nguồn)</span>
            </TabsTrigger>
            <TabsTrigger value="cloudinary" className="gap-2 font-medium">
              <Cloud className="size-4" />
              <span>Lưu trữ Cloudinary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AISettingsTab
              settings={settings.ai}
              isLoading={isLoading || isFetching}
              activeProvider={activeProvider}
              setActiveProvider={setActiveProvider}
              selectedProvider={selectedProvider}
              setSelectedProvider={setSelectedProvider}
              providersState={providersState}
              setProviderField={setProviderField}
            />
          </TabsContent>

          <TabsContent value="cloudinary">
            <CloudinarySettingsTab
              settings={settings.cloudinary}
              isLoading={isLoading || isFetching}
              profiles={cloudinaryProfiles}
              setProfiles={setCloudinaryProfiles}
              activeProfileId={activeCloudProfileId}
              setActiveProfileId={setActiveCloudProfileId}
              selectedProfileId={selectedCloudProfileId}
              setSelectedProfileId={setSelectedCloudProfileId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PrivatePageShell>
  );
}

export default function AdminSettingsPage() {
  const { data: settings, isLoading, isFetching, refetch } = useAdminSettings();

  if (isLoading || !settings) {
    return (
      <PrivatePageShell
        title="Cấu hình Hệ thống"
        description="Quản lý động các thông số API AI và dịch vụ lưu trữ hình ảnh Cloudinary."
        icon={Sliders}
      >
        <div className="mt-6 space-y-6">
          <Skeleton className="h-11 w-80 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </PrivatePageShell>
    );
  }

  // Sử dụng key từ metadata để reset form khi server refetch xong dữ liệu mới
  const formKey = `${settings.ai.activeProvider}-${settings.ai.providers?.groq?.apiKeyMasked}-${settings.ai.providers?.openrouter?.apiKeyMasked}-${settings.ai.providers?.orcarouter?.apiKeyMasked}-${settings.cloudinary.activeProfileId}-${settings.cloudinary.profiles?.length}-${settings.cloudinary.profiles?.map((p) => p.cloudName + (p.apiKeyMasked || "")).join("_")}`;

  return (
    <SettingsForm
      key={formKey}
      settings={settings}
      isLoading={isLoading}
      isFetching={isFetching}
      onRefresh={() => refetch()}
    />
  );
}
