import { apiClient } from './client';

export interface WorkspaceInfo {
  id: string;
  name: string;
  is_personal: boolean;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  role: 'owner' | 'admin' | 'member';
}

export interface WorkspaceMember {
  id: string;
  member_id?: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  status?: 'accepted' | 'pending';
}

export interface WorkspaceInvitation {
  invitation_id: string;
  workspace_id: string;
  workspace_name: string;
  invited_by_email: string;
  created_at: string;
}

/**
 * Query Key Factory cho feature Workspaces & Members.
 * Giúp quản lý cache và invalidate queries chuẩn hóa, chống typo.
 */
export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: (isArchived = false) => ['workspaces', { isArchived }] as const,
  members: (workspaceId?: string | null) => ['workspace-members', workspaceId] as const,
  history: (workspaceId?: string | null) => ['workspace-history', workspaceId] as const,
  invitations: () => ['workspace-invitations'] as const,
};

/**
 * API client layer cho Feature Workspaces & Members & Invitations.
 * Tập trung toàn bộ các cuộc gọi HTTP liên quan đến không gian làm việc và nhóm.
 */
export const workspacesApi = {
  /** Lấy danh sách workspace (hoạt động hoặc lưu trữ) */
  async list(isArchived = false): Promise<WorkspaceInfo[]> {
    const res = await apiClient<{ data: WorkspaceInfo[] }>('/api/workspaces', {
      method: 'GET',
      params: { is_archived: String(isArchived) },
    });
    return res.data ?? [];
  },

  /** Tạo mới một workspace nhóm */
  async create(name: string): Promise<WorkspaceInfo> {
    const res = await apiClient<{ data: WorkspaceInfo }>('/api/workspaces', {
      method: 'POST',
      body: { name },
    });
    return res.data;
  },

  /** Đổi tên workspace */
  async rename(id: string, name: string): Promise<WorkspaceInfo> {
    const res = await apiClient<{ data: WorkspaceInfo }>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: { name },
    });
    return res.data;
  },

  /** Giải tán / Lưu trữ workspace nhóm (có tùy chọn quyết toán số dư) */
  async archive(id: string, settleUp: boolean): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: { is_archived: true, settle_up: settleUp },
    });
  },

  /** Chuyển quyền sở hữu Owner cho thành viên khác */
  async transferOwner(id: string, newOwnerId: string): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/${id}`, {
      method: 'PATCH',
      body: { owner_id: newOwnerId },
    });
  },

  /** Rời khỏi workspace nhóm */
  async leave(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/workspaces/${id}`, {
      method: 'DELETE',
    });
  },

  /** Xóa workspace khỏi danh sách lưu trữ của cá nhân */
  async deleteArchived(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/workspaces/${id}`, {
      method: 'DELETE',
    });
  },

  /** Lấy danh sách thành viên của một workspace */
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await apiClient<{ data: WorkspaceMember[] }>(`/api/workspaces/${workspaceId}/members`, {
      method: 'GET',
    });
    return res.data ?? [];
  },

  /** Mời thành viên mới vào workspace qua email */
  async inviteMember(workspaceId: string, email: string): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: { email },
    });
  },

  /** Xóa / Kick thành viên khỏi workspace */
  async kickMember(workspaceId: string, memberId: string): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  /** Lấy danh sách lời mời vào nhóm của người dùng hiện tại */
  async listInvitations(): Promise<WorkspaceInvitation[]> {
    const res = await apiClient<{ data: WorkspaceInvitation[] }>('/api/workspaces/invitations', {
      method: 'GET',
    });
    return res.data ?? [];
  },

  /** Chấp nhận lời mời tham gia workspace */
  async acceptInvitation(invitationId: string): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/invitations/${invitationId}`, {
      method: 'PATCH',
      body: { action: 'accept' },
    });
  },

  /** Từ chối lời mời tham gia workspace */
  async declineInvitation(invitationId: string): Promise<unknown> {
    return apiClient<unknown>(`/api/workspaces/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },
};
