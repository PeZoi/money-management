import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

export interface WorkspaceInvitation {
  invitation_id: string;
  workspace_id: string;
  workspace_name: string;
  invited_by_email: string;
  created_at: string;
}

/**
 * Hook fetch danh sách lời mời workspace của người dùng hiện tại
 */
export function useWorkspaceInvitations() {
  return useQuery<WorkspaceInvitation[]>({
    queryKey: ["workspace-invitations"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces/invitations");
      if (!res.ok) throw new Error("Không thể tải danh sách lời mời");
      const json = await res.json();
      return json.data ?? [];
    },
  });
}

/**
 * Hook mutation xử lý lời mời (chấp nhận hoặc từ chối)
 */
export function useWorkspaceInvitationMutation() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const acceptMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch(`/api/workspaces/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chấp nhận lời mời thất bại");
      return json;
    },
    onSuccess: async () => {
      toast.success("Đã tham gia nhóm thành công!");
      // 1. Invalidate danh sách workspace và lời mời
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations"] });
      // 2. Refresh thông tin user để cập nhật danh sách workspace trong Zustand store
      await refreshUser();
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch(`/api/workspaces/invitations/${invitationId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Từ chối lời mời thất bại");
      return json;
    },
    onSuccess: () => {
      toast.success("Đã từ chối lời mời.");
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations"] });
    },
  });

  const isSubmitting = acceptMutation.isPending || declineMutation.isPending;

  return {
    isSubmitting,
    acceptInvitation: acceptMutation.mutateAsync,
    declineInvitation: declineMutation.mutateAsync,
  };
}
