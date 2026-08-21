import type { AIProvider } from "@/types/ai-providers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProviderSettingItem {
  hasApiKey: boolean;
  apiKey?: string;
  apiKeyMasked: string;
  isKeyFromEnv: boolean;
  model: string;
  baseUrl: string;
}

export interface CloudinaryProfile {
  id: string;
  name: string;
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  apiKeyMasked: string;
  apiSecretMasked: string;
  hasApiKey: boolean;
  hasApiSecret: boolean;
  isFromEnv: boolean;
}

export interface AdminSettingsData {
  ai: {
    activeProvider: AIProvider;
    // Backward compatibility fields
    provider: AIProvider;
    model: string;
    baseUrl: string;
    hasApiKey: boolean;
    apiKeyMasked: string;
    isKeyFromEnv: boolean;
    providers: Record<AIProvider, ProviderSettingItem>;
  };
  cloudinary: {
    activeProfileId: string;
    profiles: CloudinaryProfile[];
    cloudName: string;
    apiKey?: string;
    apiSecret?: string;
    hasApiKey: boolean;
    apiKeyMasked: string;
    hasApiSecret: boolean;
    apiSecretMasked: string;
    isFromEnv: boolean;
  };
}

export interface UpdateSettingsPayload {
  ai?: {
    activeProvider?: AIProvider;
    provider?: string;
    model?: string;
    baseUrl?: string;
    apiKey?: string;
    providers?: Partial<
      Record<
        AIProvider,
        {
          apiKey?: string;
          model?: string;
          baseUrl?: string;
        }
      >
    >;
  };
  cloudinary?: {
    activeProfileId?: string;
    profiles?: {
      id: string;
      name: string;
      cloudName: string;
      apiKey?: string;
      apiSecret?: string;
    }[];
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
  };
}

export interface TestAIPayload {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TestAIResponse {
  success: boolean;
  provider: string;
  model: string;
  latencyMs: number;
  reply: string;
  error?: string;
}

export interface TestCloudinaryPayload {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface TestCloudinaryResponse {
  success: boolean;
  message: string;
  error?: string;
}

export function useAdminSettings() {
  return useQuery<AdminSettingsData>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Không thể tải cài đặt hệ thống");
      }
      const json = await res.json();
      return json.data;
    },
    refetchOnWindowFocus: false,
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSettingsPayload) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể lưu cài đặt hệ thống");
      }
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã lưu cài đặt thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Lỗi khi lưu cài đặt");
    },
  });
}

export function useTestAIConnection() {
  return useMutation<TestAIResponse, Error, TestAIPayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/settings/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Kiểm tra kết nối AI thất bại");
      }
      return json;
    },
  });
}

export interface CloudinaryUsageReport {
  plan: string;
  lastUpdated: string;
  storage: {
    usageBytes: number;
    usageFormatted: string;
    limitBytes: number | null;
    limitFormatted: string;
    usedPercent: number;
    freeFormatted: string;
  };
  bandwidth: {
    usageBytes: number;
    usageFormatted: string;
    limitBytes: number | null;
    limitFormatted: string;
    usedPercent: number;
  };
  transformations: {
    usage: number;
    limit: number | null;
    usedPercent: number;
  };
  credits?: {
    usage: number;
    limit: number | null;
    usedPercent: number;
  };
  resourcesCount: number;
  mediaLimits?: {
    imageMaxSizeBytes?: number;
    imageMaxSizeFormatted: string;
    videoMaxSizeBytes?: number;
    videoMaxSizeFormatted: string;
  };
}

export function useTestCloudinaryConnection() {
  return useMutation<TestCloudinaryResponse, Error, TestCloudinaryPayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/settings/test-cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Kiểm tra kết nối Cloudinary thất bại");
      }
      return json;
    },
  });
}

export function useCloudinaryUsage() {
  return useMutation<
    { success: boolean; data: CloudinaryUsageReport },
    Error,
    TestCloudinaryPayload
  >({
    mutationFn: async (payload) => {
      const res = await fetch("/api/admin/settings/cloudinary-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Không thể lấy thông tin dung lượng Cloudinary");
      }
      return json;
    },
  });
}
