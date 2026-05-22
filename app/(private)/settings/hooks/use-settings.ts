/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceStore } from "@/hooks/use-workspace";
import { useTheme } from "@/components/theme-provider";
import {
  useWorkspaces,
  useWorkspaceMembers,
  useWorkspaceHistory,
  useWorkspaceMutation,
} from "@/hooks/use-workspaces";
import {
  useWorkspaceInvitations,
  useWorkspaceInvitationMutation,
} from "@/hooks/use-workspace-invitations";

export interface WorkspaceMember {
  id: string;
  member_id?: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status?: "accepted" | "pending";
}

export interface ArchivedWorkspace {
  id: string;
  name: string;
  is_personal: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  role: "owner" | "admin" | "member";
}

export function useSettings() {
  const { theme, setPrimary, resetPrimary } = useTheme();
  const color = theme.primary || "#16a34a";

  const { user } = useAuth();
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspaceStore();
  const { data: workspacesData = [] } = useWorkspaces(false);
  const workspaces = React.useMemo(() => workspacesData, [workspacesData]);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];

  const [activeTab, setActiveTab] = React.useState<"appearance" | "group" | "archived" | "invitations">("appearance");

  // Tab 2: Group Settings Inputs
  const [groupName, setGroupName] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");

  // TanStack Queries
  const { data: members = [], isLoading: membersLoading } = useWorkspaceMembers(
    activeWorkspace?.is_personal ? null : activeWorkspaceId
  );
  const { data: archivedGroups = [], isLoading: archivedLoading } = useWorkspaces(true);

  // Modals & Dialogs States
  const [memberToKick, setMemberToKick] = React.useState<WorkspaceMember | null>(null);
  const [openArchiveDialog, setOpenArchiveDialog] = React.useState(false);
  const [settleUp, setSettleUp] = React.useState(false);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = React.useState(false);

  const [openLeaveDialog, setOpenLeaveDialog] = React.useState(false);
  const [openTransferDialog, setOpenTransferDialog] = React.useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = React.useState("");

  // Tab 3: History & Delete States
  const [groupForHistory, setGroupForHistory] = React.useState<ArchivedWorkspace | null>(null);
  const { data: transactions = [], isLoading: transactionsLoading } = useWorkspaceHistory(
    groupForHistory?.id ?? null
  );
  const [groupToDelete, setGroupToDelete] = React.useState<ArchivedWorkspace | null>(null);

  // Tab 4: Workspace Invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useWorkspaceInvitations();
  const {
    isSubmitting: isInvitationSubmitting,
    acceptInvitation,
    declineInvitation,
  } = useWorkspaceInvitationMutation();

  // TanStack Mutations
  const {
    isSubmitting: isWorkspaceSubmitting,
    renameWorkspace,
    archiveWorkspace,
    transferOwner,
    leaveWorkspace,
    inviteMember,
    kickMember,
    deleteArchivedWorkspace,
  } = useWorkspaceMutation();

  const isSubmitting = isWorkspaceSubmitting || isInvitationSubmitting;

  // Synchronize Group Name input with active workspace name
  React.useEffect(() => {
    if (activeWorkspace) {
      setGroupName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  // Load accounts when archive dialog opens
  const fetchAccountsForSettle = React.useCallback(async () => {
    if (!activeWorkspaceId) return;
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/accounts?workspace_id=${activeWorkspaceId}`);
      const result = await res.json();
      if (res.ok && result.data) {
        setAccounts(result.data);
      }
    } catch (err) {
      console.error("Fetch accounts error:", err);
    } finally {
      setAccountsLoading(false);
    }
  }, [activeWorkspaceId]);

  React.useEffect(() => {
    if (openArchiveDialog) {
      fetchAccountsForSettle();
    }
  }, [openArchiveDialog, fetchAccountsForSettle]);

  // Helpers for calculations
  const totalBalance = React.useMemo(() => {
    return accounts.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
  }, [accounts]);

  const shareAmount = React.useMemo(() => {
    if (members.length === 0) return 0;
    return Math.floor(totalBalance / members.length);
  }, [totalBalance, members.length]);

  const remainderAmount = React.useMemo(() => {
    if (members.length === 0) return 0;
    return totalBalance % members.length;
  }, [totalBalance, members.length]);

  // Handler: Update group name
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupName === activeWorkspace?.name) return;
    try {
      await renameWorkspace({ id: activeWorkspaceId!, name: groupName.trim() });
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Handler: Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember({ id: activeWorkspaceId!, email: inviteEmail.trim() });
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Handler: Kick member
  const handleKickMember = async () => {
    if (!memberToKick) return;
    try {
      await kickMember({ id: activeWorkspaceId!, memberId: memberToKick.id });
      setMemberToKick(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Handler: Archive group (Resolve / Settle up)
  const handleArchiveGroup = async () => {
    try {
      await archiveWorkspace({ id: activeWorkspaceId!, settleUp });
      setOpenArchiveDialog(false);
      // Switch to personal workspace
      const personal = user?.workspaces?.find((w) => w.is_personal);
      if (personal) {
        setActiveWorkspaceId(personal.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Handler: Leave Group for member
  const handleLeaveGroup = async () => {
    try {
      await leaveWorkspace(activeWorkspaceId!);
      setOpenLeaveDialog(false);
      const personal = user?.workspaces?.find((w) => w.is_personal);
      if (personal) {
        setActiveWorkspaceId(personal.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Handler: Transfer Owner and Leave Group
  const handleTransferAndLeave = async () => {
    if (!selectedNewOwner) return;
    try {
      // 1. Chuyển quyền Owner
      await transferOwner({ id: activeWorkspaceId!, newOwnerId: selectedNewOwner });
      // 2. Rời nhóm
      await leaveWorkspace(activeWorkspaceId!);
      toast.success("Đã chuyển nhượng quyền chủ nhóm và rời khỏi nhóm thành công!");
      setOpenTransferDialog(false);
      const personal = user?.workspaces?.find((w) => w.is_personal);
      if (personal) {
        setActiveWorkspaceId(personal.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra");
    }
  };

  // Handler: Delete Archived group from my list
  const handleDeleteArchivedGroup = async () => {
    if (!groupToDelete) return;
    try {
      await deleteArchivedWorkspace(groupToDelete.id);
      setGroupToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể kết nối đến máy chủ");
    }
  };

  // Helpers format
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCurrentOwner = activeWorkspace?.role === "owner";

  return {
    theme,
    color,
    user,
    setPrimary,
    resetPrimary,
    activeWorkspaceId,
    setActiveWorkspaceId,
    workspaces,
    activeWorkspace,
    activeTab,
    setActiveTab,
    groupName,
    setGroupName,
    inviteEmail,
    setInviteEmail,
    members,
    membersLoading,
    archivedGroups,
    archivedLoading,
    memberToKick,
    setMemberToKick,
    openArchiveDialog,
    setOpenArchiveDialog,
    settleUp,
    setSettleUp,
    accounts,
    accountsLoading,
    openLeaveDialog,
    setOpenLeaveDialog,
    openTransferDialog,
    setOpenTransferDialog,
    selectedNewOwner,
    setSelectedNewOwner,
    groupForHistory,
    setGroupForHistory,
    transactions,
    transactionsLoading,
    groupToDelete,
    setGroupToDelete,
    isSubmitting,
    handleUpdateName,
    handleInviteMember,
    handleKickMember,
    handleArchiveGroup,
    handleLeaveGroup,
    handleTransferAndLeave,
    handleDeleteArchivedGroup,
    totalBalance,
    shareAmount,
    remainderAmount,
    formatVND,
    formatDate,
    isCurrentOwner,
    invitations,
    invitationsLoading,
    acceptInvitation,
    declineInvitation,
  };
}
