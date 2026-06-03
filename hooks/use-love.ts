import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { 
  MyLoveConnection, 
  LoveMilestoneRow, 
  AdminLoveUser 
} from "@/types/database";

// ─── User Hooks ─────────────────────────────────────────

/**
 * Hook lấy kết nối tình yêu của user hiện tại.
 */
export function useMyLoveConnection() {
  return useQuery<MyLoveConnection | null>({
    queryKey: ["my-love-connection"],
    queryFn: async () => {
      const res = await fetch("/api/love/my-connection");
      if (!res.ok) throw new Error("Không thể tải thông tin ngày bên nhau");
      const json = await res.json();
      return json.data;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook lấy danh sách cột mốc kỷ niệm.
 */
export function useLoveMilestones(connectionId: string | undefined) {
  return useQuery<LoveMilestoneRow[]>({
    queryKey: ["love-milestones", connectionId],
    queryFn: async () => {
      if (!connectionId) return [];
      const res = await fetch(`/api/love/milestones?connectionId=${connectionId}`);
      if (!res.ok) throw new Error("Không thể tải danh sách kỷ niệm");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!connectionId,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook mutation cho các thao tác của cặp đôi (đổi ngày kỷ niệm, thêm/sửa/xóa cột mốc).
 */
export function useLoveMutation() {
  const queryClient = useQueryClient();

  // 1. Cập nhật ngày kỷ niệm
  const updateAnniversaryMutation = useMutation({
    mutationFn: async ({ connectionId, anniversaryDate }: { connectionId: string; anniversaryDate: string }) => {
      const res = await fetch("/api/love/update-anniversary", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, anniversaryDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể cập nhật ngày kỷ niệm");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật ngày kỷ niệm thành công!");
      queryClient.invalidateQueries({ queryKey: ["my-love-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 2. Tạo cột mốc mới
  const createMilestoneMutation = useMutation({
    mutationFn: async (milestone: {
      connectionId: string;
      title: string;
      description?: string | null;
      milestoneDate: string;
      icon?: string;
      imageUrl?: string | null;
    }) => {
      const res = await fetch("/api/love/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestone),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể tạo cột mốc kỷ niệm");
      return json;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Đã lưu một kỷ niệm mới!");
      queryClient.invalidateQueries({ queryKey: ["love-milestones", variables.connectionId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 3. Sửa cột mốc
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({
      id,
      connectionId,
      ...milestone
    }: {
      id: string;
      connectionId: string;
      title: string;
      description?: string | null;
      milestoneDate: string;
      icon?: string;
      imageUrl?: string | null;
    }) => {
      const res = await fetch(`/api/love/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestone),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể sửa cột mốc kỷ niệm");
      return json;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Kỷ niệm đã được cập nhật!");
      queryClient.invalidateQueries({ queryKey: ["love-milestones", variables.connectionId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 4. Xóa cột mốc
  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ id, connectionId }: { id: string; connectionId: string }) => {
      const res = await fetch(`/api/love/milestones/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể xóa cột mốc");
      return json;
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Đã xóa kỷ niệm.");
      queryClient.invalidateQueries({ queryKey: ["love-milestones", variables.connectionId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 5. Cập nhật URL ảnh tùy chỉnh
  const updateLoveCustomizeMutation = useMutation({
    mutationFn: async (payload: {
      connectionId: string;
      user1AvatarUrl?: string | null;
      user2AvatarUrl?: string | null;
      backgroundUrl?: string | null;
      user1Nickname?: string | null;
      user2Nickname?: string | null;
      user1Birthdate?: string | null;
      user2Birthdate?: string | null;
      theme?: string | null;
    }) => {
      const res = await fetch("/api/love/customize", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể cập nhật cấu hình giao diện");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật giao diện thành công!");
      queryClient.invalidateQueries({ queryKey: ["my-love-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 6. Upload ảnh lên Cloudinary
  const uploadLoveAssetMutation = useMutation({
    mutationFn: async (payload: {
      file: File;
      type: "avatar1" | "avatar2" | "background" | "milestone";
      connectionId: string;
      onProgress?: (percent: number) => void;
    }) => {
      return new Promise<{ success: boolean; url: string; message: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", payload.file);
        formData.append("type", payload.type);
        formData.append("connectionId", payload.connectionId);

        xhr.open("POST", "/api/love/upload");

        const onProgress = payload.onProgress;
        if (xhr.upload && onProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          });
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Phản hồi từ server không hợp lệ"));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error || "Tải ảnh lên thất bại"));
            } catch (e) {
              reject(new Error(`Tải ảnh lên thất bại với mã lỗi ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Lỗi kết nối mạng"));
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tải ảnh lên và cập nhật thành công!");
      queryClient.invalidateQueries({ queryKey: ["my-love-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    isUpdatingAnniversary: updateAnniversaryMutation.isPending,
    isCreatingMilestone: createMilestoneMutation.isPending,
    isUpdatingMilestone: updateMilestoneMutation.isPending,
    isDeletingMilestone: deleteMilestoneMutation.isPending,
    isUpdatingCustomize: updateLoveCustomizeMutation.isPending,
    isUploadingAsset: uploadLoveAssetMutation.isPending,
    updateAnniversary: updateAnniversaryMutation.mutateAsync,
    createMilestone: createMilestoneMutation.mutateAsync,
    updateMilestone: updateMilestoneMutation.mutateAsync,
    deleteMilestone: deleteMilestoneMutation.mutateAsync,
    updateLoveCustomize: updateLoveCustomizeMutation.mutateAsync,
    uploadLoveAsset: uploadLoveAssetMutation.mutateAsync,
  };
}

// ─── Admin Hooks ────────────────────────────────────────

/**
 * Hook Admin lấy danh sách users và trạng thái bắt cặp.
 */
export function useAdminLoveUsers() {
  return useQuery<AdminLoveUser[]>({
    queryKey: ["admin-love-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/love/users");
      if (!res.ok) throw new Error("Không thể tải danh sách kết nối");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook Admin thực hiện mutation bắt cặp/hủy bắt cặp.
 */
export function useAdminLoveMutation() {
  const queryClient = useQueryClient();

  // Bắt cặp
  const connectMutation = useMutation({
    mutationFn: async (payload: { userId1: string; userId2: string; anniversaryDate: string }) => {
      const res = await fetch("/api/admin/love/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kết nối thất bại");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Kết nối cặp đôi thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin-love-users"] });
      // Clear cache của my-love-connection để cập nhật sidebar tức thì nếu là admin tự kết nối mình
      queryClient.invalidateQueries({ queryKey: ["my-love-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Hủy kết nối
  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`/api/admin/love/disconnect/${connectionId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Hủy kết nối thất bại");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã hủy kết nối cặp đôi!");
      queryClient.invalidateQueries({ queryKey: ["admin-love-users"] });
      queryClient.invalidateQueries({ queryKey: ["my-love-connection"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return {
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connectUsers: connectMutation.mutateAsync,
    disconnectUsers: disconnectMutation.mutateAsync,
  };
}
