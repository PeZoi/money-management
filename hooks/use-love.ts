import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import type { 
  MyLoveConnection, 
  LoveMilestoneRow, 
  AdminLoveUser 
} from "@/types/database";

export interface LoveMilestonesApiResponse {
  data: LoveMilestoneRow[];
  next_cursor: string | null;
  has_more: boolean;
}

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
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook fetch danh sách cột mốc kỷ niệm phân trang Infinite Scroll.
 */
export function useInfiniteLoveMilestones(params?: {
  connectionId?: string;
  order?: "desc" | "asc";
  limit?: number;
}) {
  const limit = params?.limit || 12;
  const order = params?.order || "desc";

  const queryResult = useInfiniteQuery({
    queryKey: ["love-milestones-infinite", params?.connectionId, order],
    queryFn: async ({ pageParam }: { pageParam: string | null }): Promise<LoveMilestonesApiResponse> => {
      const searchParams = new URLSearchParams({
        limit: String(limit),
        order,
      });

      if (params?.connectionId) searchParams.set("connectionId", params.connectionId);
      if (pageParam) searchParams.set("cursor", pageParam);

      const res = await fetch(`/api/love/milestones?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Không thể tải danh sách kỷ niệm");
      return await res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 5 * 60 * 1000, // Cache 5 phút
    refetchOnWindowFocus: false,
  });

  const milestones: LoveMilestoneRow[] = useMemo(() => {
    return queryResult.data?.pages.flatMap((page) => page.data) || [];
  }, [queryResult.data]);

  return {
    ...queryResult,
    milestones,
  };
}

/**
 * Hook lấy danh sách cột mốc kỷ niệm (backward compatibility).
 */
export function useLoveMilestones(connectionId: string | undefined) {
  return useQuery<LoveMilestoneRow[]>({
    queryKey: ["love-milestones", connectionId],
    queryFn: async () => {
      const url = connectionId ? `/api/love/milestones?connectionId=${connectionId}` : "/api/love/milestones";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Không thể tải danh sách kỷ niệm");
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
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
    onSuccess: (data) => {
      toast.success(data.message || "Đã lưu một kỷ niệm mới!");
      queryClient.invalidateQueries({ queryKey: ["love-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["love-milestones-infinite"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 3. Sửa cột mốc
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      milestoneDate,
      icon,
      imageUrl,
    }: {
      id: string;
      connectionId?: string;
      title: string;
      description?: string | null;
      milestoneDate: string;
      icon?: string;
      imageUrl?: string | null;
    }) => {
      const res = await fetch(`/api/love/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          milestoneDate,
          icon,
          imageUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể sửa cột mốc kỷ niệm");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Kỷ niệm đã được cập nhật!");
      queryClient.invalidateQueries({ queryKey: ["love-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["love-milestones-infinite"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // 4. Xóa cột mốc
  const deleteMilestoneMutation = useMutation({
    mutationFn: async ({ id }: { id: string; connectionId?: string }) => {
      const res = await fetch(`/api/love/milestones/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể xóa cột mốc");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã xóa kỷ niệm.");
      queryClient.invalidateQueries({ queryKey: ["love-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["love-milestones-infinite"] });
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

  // 6. Upload file trực tiếp lên Cloudinary (Client-side signed upload)
  const uploadLoveAssetMutation = useMutation({
    mutationFn: async (payload: {
      file: File;
      type: "avatar1" | "avatar2" | "background" | "milestone";
      connectionId: string;
      milestoneTitle?: string;
      onProgress?: (percent: number) => void;
    }) => {
      // 1. Lấy Signature từ backend Next.js
      const sigRes = await fetch("/api/love/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: payload.type,
          connectionId: payload.connectionId,
          milestoneTitle: payload.milestoneTitle,
        }),
      });

      const sigJson = await sigRes.json();
      if (!sigRes.ok) {
        throw new Error(sigJson.error || "Không thể khởi tạo phiên tải lên.");
      }

      const { signature, timestamp, folder, public_id, apiKey, cloudName } = sigJson;

      // 2. Tải trực tiếp file lên Cloudinary thông qua XMLHttpRequest để theo dõi progress
      return new Promise<{ success: boolean; url: string; message: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append("file", payload.file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("public_id", public_id);

        const resourceType = payload.file.type.startsWith("video/") ? "video" : "image";
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

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
              resolve({
                success: true,
                url: response.secure_url,
                message: "Tải lên thành công!",
              });
            } catch {
              reject(new Error("Phản hồi từ máy chủ Cloudinary không hợp lệ"));
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error?.message || "Tải lên Cloudinary thất bại"));
            } catch {
              reject(new Error(`Tải lên Cloudinary thất bại với mã lỗi ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Lỗi kết nối mạng khi tải lên"));
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tải ảnh lên thành công!");
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
