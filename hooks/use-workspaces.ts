import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { useWorkspaceStore } from "./use-workspace";

interface WorkspaceInfo {
  id: string;
  name: string;
  is_personal: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  role: "owner" | "admin" | "member";
}

interface WorkspaceMember {
  id: string;
  member_id?: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status?: "accepted" | "pending";
}

interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  note: string | null;
  created_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  } | null;
  account?: {
    id: string;
    name: string;
    icon?: string;
  } | null;
  to_account?: {
    id: string;
    name: string;
    icon?: string;
  } | null;
  created_by_details?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

/**
 * Hook fetch danh sách workspaces
 */
export function useWorkspaces(isArchived = false) {
  return useQuery<WorkspaceInfo[]>({
    queryKey: ["workspaces", { isArchived }],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces?is_archived=${isArchived}`);
      if (!res.ok) throw new Error("Không thể tải danh sách workspace");
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: isArchived ? false : 20000,
  });
}

/**
 * Hook fetch danh sách thành viên của một workspace
 */
export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery<WorkspaceMember[]>({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) throw new Error("Không thể tải danh sách thành viên");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });
}

/**
 * Hook fetch toàn bộ lịch sử giao dịch (chỉ đọc) của một workspace lưu trữ
 */
export function useWorkspaceHistory(workspaceId: string | null) {
  return useQuery<Transaction[]>({
    queryKey: ["workspace-history", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await fetch(`/api/transactions?workspace_id=${workspaceId}&month=all`);
      if (!res.ok) throw new Error("Không thể tải lịch sử giao dịch");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!workspaceId,
  });
}

/**
 * Hook mutation: tạo, sửa, xóa, rời nhóm, giải tán, mời/kick thành viên
 */
export function useWorkspaceMutation() {
  const queryClient = useQueryClient();
  const { refreshUser, user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Tạo nhóm thất bại");
      return json.data;
    },
    onSuccess: async () => {
      toast.success("Tạo nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: ["workspaces", { isArchived: false }] });
      await refreshUser();
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Đổi tên thất bại");
      return json.data;
    },
    onSuccess: async () => {
      toast.success("Cập nhật tên nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: ["workspaces", { isArchived: false }] });
      await refreshUser();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, settleUp }: { id: string; settleUp: boolean }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: true, settle_up: settleUp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Giải tán nhóm thất bại");
      return json;
    },
    onSuccess: async (_, variables) => {
      toast.success("Giải tán nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["accounts", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", variables.id] });
      
      // Nếu nhóm vừa giải tán đang là workspace active hiện tại, tự động chuyển về workspace cá nhân
      const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore.getState();
      if (activeWorkspaceId === variables.id) {
        const personal = user?.workspaces?.find((w) => w.is_personal);
        if (personal) {
          setActiveWorkspaceId(personal.id);
        }
      }
      
      await refreshUser();
    },
  });

  const transferOwnerMutation = useMutation({
    mutationFn: async ({ id, newOwnerId }: { id: string; newOwnerId: string }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: newOwnerId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chuyển nhượng thất bại");
      return json;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.id] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Rời nhóm thất bại");
      return json;
    },
    onSuccess: async () => {
      toast.success("Đã rời khỏi nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await refreshUser();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await fetch(`/api/workspaces/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mời thành viên thất bại");
      return json;
    },
    onSuccess: (_, variables) => {
      toast.success("Mời thành viên thành công!");
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.id] });
    },
  });

  const kickMutation = useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      const res = await fetch(`/api/workspaces/${id}/members/${memberId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Kick thành viên thất bại");
      return json;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", variables.id] });
    },
  });

  const deleteArchivedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Xóa nhóm lưu trữ thất bại");
      return json;
    },
    onSuccess: async () => {
      toast.success("Đã xóa nhóm khỏi danh sách lưu trữ của bạn.");
      queryClient.invalidateQueries({ queryKey: ["workspaces", { isArchived: true }] });
      await refreshUser();
    },
  });

  const isSubmitting =
    createMutation.isPending ||
    renameMutation.isPending ||
    archiveMutation.isPending ||
    transferOwnerMutation.isPending ||
    leaveMutation.isPending ||
    inviteMutation.isPending ||
    kickMutation.isPending ||
    deleteArchivedMutation.isPending;

  return {
    isSubmitting,
    createWorkspace: createMutation.mutateAsync,
    renameWorkspace: renameMutation.mutateAsync,
    archiveWorkspace: archiveMutation.mutateAsync,
    transferOwner: transferOwnerMutation.mutateAsync,
    leaveWorkspace: leaveMutation.mutateAsync,
    inviteMember: inviteMutation.mutateAsync,
    kickMember: kickMutation.mutateAsync,
    deleteArchivedWorkspace: deleteArchivedMutation.mutateAsync,
  };
}
