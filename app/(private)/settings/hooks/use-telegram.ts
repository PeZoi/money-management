import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TelegramConnectionInfo {
  connected: boolean;
  telegram_username: string | null;
  telegram_display_name: string | null;
  telegram_avatar_path: string | null;
  is_auto_backup: boolean;
  backup_interval: "daily" | "weekly" | "monthly";
  backup_day: number;
  backup_hour: number;
}

export interface ConnectionTokenResponse {
  link: string;
  token: string;
}

export interface UpdateTelegramConfigPayload {
  is_auto_backup?: boolean;
  backup_interval?: "daily" | "weekly" | "monthly";
  backup_day?: number;
  backup_hour?: number;
}

export function useTelegram() {
  const queryClient = useQueryClient();

  // 1. Query trạng thái kết nối Telegram và cấu hình lịch sao lưu
  const {
    data: connection = {
      connected: false,
      telegram_username: null,
      telegram_display_name: null,
      telegram_avatar_path: null,
      is_auto_backup: false,
      backup_interval: "weekly",
      backup_day: 1,
      backup_hour: 0,
    },
    isLoading,
    refetch,
  } = useQuery<TelegramConnectionInfo>({
    queryKey: ["telegram-connection"],
    queryFn: async () => {
      const res = await fetch("/api/telegram/connection");
      if (!res.ok) {
        throw new Error("Không thể lấy trạng thái kết nối Telegram");
      }
      const json = await res.json();
      return json;
    },
  });

  // 2. Mutation sinh mã kết nối Telegram (Deep Link)
  const generateTokenMutation = useMutation<ConnectionTokenResponse, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/connection", { method: "POST" });
      if (!res.ok) {
        throw new Error("Không thể tạo link kết nối");
      }
      return res.json();
    },
    onError: (error) => {
      toast.error(error.message || "Tạo liên kết thất bại");
    },
  });

  // 3. Mutation hủy liên kết Telegram
  const disconnectMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/connection", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Hủy kết nối thất bại");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-connection"] });
      toast.success("Đã hủy liên kết với Telegram Bot");
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi hủy liên kết");
    },
  });

  // 4. Mutation cập nhật cài đặt cấu hình sao lưu
  const updateConfigMutation = useMutation<void, Error, UpdateTelegramConfigPayload>({
    mutationFn: async (payload: UpdateTelegramConfigPayload) => {
      const res = await fetch("/api/telegram/connection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Cập nhật cấu hình thất bại");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-connection"] });
      toast.success("Cập nhật cấu hình thành công");
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi cập nhật cấu hình");
    },
  });

  // 5. Mutation gửi yêu cầu sao lưu dữ liệu qua Telegram ngay lập tức
  const triggerBackupMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/backup", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Gửi file sao lưu thất bại");
      }
    },
    onSuccess: () => {
      toast.success("File sao lưu đã được gửi đến tài khoản Telegram của bạn!");
    },
    onError: (error) => {
      toast.error(error.message || "Không thể thực hiện sao lưu");
    },
  });

  // 6. Mutation đồng bộ thông tin Telegram (họ tên, username, avatar) thực tế từ Bot API
  const syncConnectionMutation = useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/connection", { method: "PATCH" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Đồng bộ thông tin Telegram thất bại");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-connection"] });
      toast.success("Đã đồng bộ thông tin Telegram mới nhất!");
    },
    onError: (error) => {
      toast.error(error.message || "Lỗi khi đồng bộ thông tin Telegram");
    },
  });

  return {
    connection,
    isLoading,
    refetchConnection: refetch,
    generateToken: generateTokenMutation.mutateAsync,
    isGeneratingToken: generateTokenMutation.isPending,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    updateConfig: updateConfigMutation.mutate,
    isUpdatingConfig: updateConfigMutation.isPending,
    triggerBackup: triggerBackupMutation.mutate,
    isBackingUp: triggerBackupMutation.isPending,
    syncConnection: syncConnectionMutation.mutateAsync,
    isSyncingConnection: syncConnectionMutation.isPending,
  };
}
