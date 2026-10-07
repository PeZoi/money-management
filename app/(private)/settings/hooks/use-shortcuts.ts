import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ShortcutKeyResponse {
  success: boolean;
  apiKey: string | null;
  createdAt?: string;
  isFallback?: boolean;
}

export function useShortcuts() {
  const queryClient = useQueryClient();

  // 1. Query lấy API Key cá nhân của người dùng
  const {
    data: keyData,
    isLoading: isKeyLoading,
    refetch: refetchKey,
  } = useQuery<ShortcutKeyResponse>({
    queryKey: ["shortcut-api-key"],
    queryFn: async () => {
      const res = await fetch("/api/shortcuts/key");
      if (!res.ok) {
        return { success: false, apiKey: null };
      }
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // Cache 10 phút
  });

  // 2. Mutation tạo mã mới hoặc làm mới (Generate / Regenerate) API Key
  const generateKeyMutation = useMutation<ShortcutKeyResponse, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/shortcuts/key", { method: "POST" });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.message || "Không thể tạo API Key");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["shortcut-api-key"], data);
      toast.success("Đã tạo API Key thành công!");
    },
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra khi tạo API Key");
    },
  });

  return {
    apiKey: keyData?.apiKey ?? null,
    hasKey: Boolean(keyData?.apiKey),
    isKeyLoading,
    refetchKey,
    generateKey: generateKeyMutation.mutate,
    isGenerating: generateKeyMutation.isPending,
  };
}
