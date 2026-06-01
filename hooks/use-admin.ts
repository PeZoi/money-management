import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  total_workspaces: number;
  total_transactions: number;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  system_role: "admin" | "user";
  created_at: string;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  is_personal: boolean;
  is_archived: boolean;
  created_by: string;
  owner_email: string | null;
  owner_display_name: string | null;
  owner_avatar_url: string | null;
  member_count: number;
  created_at: string;
}

export interface AdminUserFilters {
  search?: string;
  role?: "all" | "admin" | "user";
}

export interface AdminWorkspaceFilters {
  search?: string;
  type?: "all" | "personal" | "group";
}

// ─── Query Hooks ────────────────────────────────────────

/**
 * Hook fetch thống kê tổng quan hệ thống cho Admin Dashboard.
 */
export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Không thể tải thống kê hệ thống");
      const json = await res.json();
      return json.data;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook fetch danh sách tất cả users.
 * Lọc phía client theo search (email/tên) và role.
 */
export function useAdminUsers(filters?: AdminUserFilters) {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnWindowFocus: false,
    select: (data) => {
      let filtered = data;

      // Lọc theo search keyword (email hoặc tên hiển thị)
      if (filters?.search) {
        const keyword = filters.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.email?.toLowerCase().includes(keyword) ||
            u.display_name?.toLowerCase().includes(keyword)
        );
      }

      // Lọc theo role
      if (filters?.role && filters.role !== "all") {
        filtered = filtered.filter((u) => u.system_role === filters.role);
      }

      return filtered;
    },
  });
}

/**
 * Hook fetch danh sách tất cả workspaces.
 * Lọc phía client theo search (tên) và type (personal/group).
 */
export function useAdminWorkspaces(filters?: AdminWorkspaceFilters) {
  return useQuery<AdminWorkspace[]>({
    queryKey: ["admin-workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/admin/workspaces");
      if (!res.ok) throw new Error("Không thể tải danh sách workspace");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnWindowFocus: false,
    select: (data) => {
      let filtered = data;

      // Lọc theo search keyword (tên workspace)
      if (filters?.search) {
        const keyword = filters.search.toLowerCase();
        filtered = filtered.filter(
          (w) =>
            w.name.toLowerCase().includes(keyword) ||
            w.owner_email?.toLowerCase().includes(keyword) ||
            w.owner_display_name?.toLowerCase().includes(keyword)
        );
      }

      // Lọc theo loại hình
      if (filters?.type && filters.type !== "all") {
        filtered = filtered.filter((w) =>
          filters.type === "personal" ? w.is_personal : !w.is_personal
        );
      }

      return filtered;
    },
  });
}

// ─── Mutation Hook ──────────────────────────────────────

/**
 * Hook mutation cho các thao tác admin: thay đổi role người dùng.
 */
export function useAdminMutation() {
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Cập nhật vai trò thất bại");
      return json;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cập nhật vai trò thành công!");
      // Tự động làm mới dữ liệu
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể cập nhật vai trò");
    },
  });

  const updateUserRole = async (
    userId: string,
    role: "admin" | "user",
    options?: { onSuccess?: () => void }
  ) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  return {
    isSubmitting: updateRoleMutation.isPending,
    updateUserRole,
  };
}

// ─── Types mới cho Dashboard Analytics ──────────────────

export interface GrowthDataPoint {
  date: string;
  new_users: number;
  new_workspaces: number;
}

export interface WorkspaceCompositionData {
  personal_count: number;
  group_count: number;
}

export interface AdminAnalyticsData {
  growth: GrowthDataPoint[];
  composition: WorkspaceCompositionData;
}

export interface AdminActivity {
  activity_type: "user_signup" | "workspace_create" | "transaction_create";
  target_name: string;
  actor_name: string;
  created_at: string;
}

export interface AdminHealthData {
  dbSizeBytes: number;
  status: "healthy" | "unhealthy";
  responseTimeMs?: number;
}

// ─── Hooks phân tích mới ─────────────────────────────────

/**
 * Hook fetch biểu đồ phân tích (Tăng trưởng & Cơ cấu).
 */
export function useAdminAnalytics() {
  return useQuery<AdminAnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Không thể tải dữ liệu phân tích hệ thống");
      const json = await res.json();
      return json.data;
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook fetch danh sách 7 hoạt động hệ thống thực tế gần đây nhất.
 */
export function useAdminActivities() {
  return useQuery<AdminActivity[]>({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activities");
      if (!res.ok) throw new Error("Không thể tải nhật ký hoạt động hệ thống");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook fetch thông tin sức khỏe hệ thống (dung lượng DB).
 * Refetch mỗi 30 giây để cập nhật các thông số động.
 */
export function useAdminHealth() {
  return useQuery<AdminHealthData>({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const start = performance.now();
      const res = await fetch("/api/admin/health");
      const end = performance.now();
      if (!res.ok) throw new Error("Không thể tải trạng thái hệ thống");
      const json = await res.json();
      return {
        ...json.data,
        responseTimeMs: Math.round(end - start),
      };
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });
}
