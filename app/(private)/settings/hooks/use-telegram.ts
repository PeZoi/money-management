import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface TelegramConnectionInfo {
  connected: boolean;
  telegram_username: string | null;
  is_auto_backup: boolean;
}

export interface ConnectionTokenResponse {
  link: string;
  token: string;
}

export function useTelegram() {
  const queryClient = useQueryClient();

  // 1. Query trạng thái kết nối Telegram
  const {
    data: connection = { connected: false, telegram_username: null, is_auto_backup: false },
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

  // 4. Mutation thay đổi cài đặt tự động sao lưu
  const toggleAutoBackupMutation = useMutation<void, Error, boolean>({
    mutationFn: async (is_auto_backup: boolean) => {
      const res = await fetch("/api/telegram/connection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_auto_backup }),
      });
      if (!res.ok) {
        throw new Error("Cập nhật cấu hình tự động sao lưu thất bại");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram-connection"] });
      toast.success("Cập nhật cài đặt tự động sao lưu thành công");
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

  return {
    connection,
    isLoading,
    refetchConnection: refetch,
    generateToken: generateTokenMutation.mutateAsync,
    isGeneratingToken: generateTokenMutation.isPending,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    toggleAutoBackup: toggleAutoBackupMutation.mutate,
    isTogglingAutoBackup: toggleAutoBackupMutation.isPending,
    triggerBackup: triggerBackupMutation.mutate,
    isBackingUp: triggerBackupMutation.isPending,
  };
}
