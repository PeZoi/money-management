import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import {
  workspacesApi,
  workspaceKeys,
  type WorkspaceInvitation,
} from "@/lib/api/workspaces";

export type { WorkspaceInvitation };

/**
 * Hook fetch danh sách lời mời workspace của người dùng hiện tại
 */
export function useWorkspaceInvitations() {
  return useQuery<WorkspaceInvitation[]>({
    queryKey: workspaceKeys.invitations(),
    queryFn: async () => {
      return workspacesApi.listInvitations();
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
      return workspacesApi.acceptInvitation(invitationId);
    },
    onSuccess: async () => {
      toast.success("Đã tham gia nhóm thành công!");
      // 1. Invalidate danh sách workspace và lời mời
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations() });
      // 2. Refresh thông tin user để cập nhật danh sách workspace trong Zustand store
      await refreshUser();
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return workspacesApi.declineInvitation(invitationId);
    },
    onSuccess: () => {
      toast.success("Đã từ chối lời mời.");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.invitations() });
    },
  });

  const isSubmitting = acceptMutation.isPending || declineMutation.isPending;

  return {
    isSubmitting,
    acceptInvitation: acceptMutation.mutateAsync,
    declineInvitation: declineMutation.mutateAsync,
  };
}
