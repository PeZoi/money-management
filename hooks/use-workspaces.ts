import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { useWorkspaceStore } from "./use-workspace";
import { transactionsApi, transactionKeys } from "@/lib/api/transactions";
import {
  workspacesApi,
  workspaceKeys,
  type WorkspaceInfo,
  type WorkspaceMember,
} from "@/lib/api/workspaces";
import { accountKeys } from "@/lib/api/accounts";

export type { WorkspaceInfo, WorkspaceMember };

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
    queryKey: workspaceKeys.list(isArchived),
    queryFn: async () => {
      return workspacesApi.list(isArchived);
    },
    // Không tự động fetch định kỳ và khi focus lại cửa sổ trình duyệt
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook fetch danh sách thành viên của một workspace
 */
export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery<WorkspaceMember[]>({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return [];
      return workspacesApi.listMembers(workspaceId);
    },
    enabled: !!workspaceId,
  });
}

/**
 * Hook fetch toàn bộ lịch sử giao dịch (chỉ đọc) của một workspace lưu trữ
 */
export function useWorkspaceHistory(workspaceId: string | null) {
  return useQuery<Transaction[]>({
    queryKey: workspaceKeys.history(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await transactionsApi.list({
        workspace_id: workspaceId,
        month: 'all',
        limit: 'all',
      });
      return (res.data ?? []) as unknown as Transaction[];
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
      return workspacesApi.create(name);
    },
    onSuccess: async () => {
      toast.success("Tạo nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list(false) });
      await refreshUser();
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return workspacesApi.rename(id, name);
    },
    onSuccess: async () => {
      toast.success("Cập nhật tên nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list(false) });
      await refreshUser();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, settleUp }: { id: string; settleUp: boolean }) => {
      return workspacesApi.archive(id, settleUp);
    },
    onSuccess: async (_, variables) => {
      toast.success("Giải tán nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.workspace(variables.id) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.workspace(variables.id) });
      
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
      return workspacesApi.transferOwner(id, newOwnerId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (id: string) => {
      return workspacesApi.leave(id);
    },
    onSuccess: async () => {
      toast.success("Đã rời khỏi nhóm thành công!");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      await refreshUser();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      return workspacesApi.inviteMember(id, email);
    },
    onSuccess: (_, variables) => {
      toast.success("Mời thành viên thành công!");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) });
    },
  });

  const kickMutation = useMutation({
    mutationFn: async ({ id, memberId }: { id: string; memberId: string }) => {
      return workspacesApi.kickMember(id, memberId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(variables.id) });
    },
  });

  const deleteArchivedMutation = useMutation({
    mutationFn: async (id: string) => {
      return workspacesApi.deleteArchived(id);
    },
    onSuccess: async () => {
      toast.success("Đã xóa nhóm khỏi danh sách lưu trữ của bạn.");
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list(true) });
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
