import { apiClient } from './client';
import type { MyLoveConnection, LoveMilestoneRow } from '@/types/database';

export interface LoveMilestonesApiResponse {
  data: LoveMilestoneRow[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface UpdateAnniversaryPayload {
  connectionId: string;
  anniversaryDate: string;
}

export interface CreateMilestonePayload {
  connectionId: string;
  title: string;
  description?: string | null;
  milestoneDate: string;
  icon?: string;
  imageUrl?: string | null;
}

export interface UpdateMilestonePayload {
  title: string;
  description?: string | null;
  milestoneDate: string;
  icon?: string;
  imageUrl?: string | null;
}

export interface UpdateLoveCustomizePayload {
  connectionId: string;
  user1AvatarUrl?: string | null;
  user2AvatarUrl?: string | null;
  backgroundUrl?: string | null;
  user1Nickname?: string | null;
  user2Nickname?: string | null;
  user1Birthdate?: string | null;
  user2Birthdate?: string | null;
  theme?: string | null;
}

export interface UploadSignaturePayload {
  type: 'avatar1' | 'avatar2' | 'background' | 'milestone';
  connectionId: string;
  milestoneTitle?: string;
}

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  folder: string;
  public_id: string;
  apiKey: string;
  cloudName: string;
}

/**
 * Query Key Factory cho feature Love Space.
 */
export const loveKeys = {
  all: ['love'] as const,
  connection: () => ['my-love-connection'] as const,
  milestones: (connectionId?: string) => ['love-milestones', connectionId] as const,
  milestonesInfinite: (connectionId?: string, order?: string) =>
    ['love-milestones-infinite', connectionId, order] as const,
};

/**
 * API client layer cho Feature Love Space.
 * Tập trung các cuộc gọi HTTP liên quan đến không gian tình yêu đôi lứa.
 */
export const loveApi = {
  /** Lấy kết nối tình yêu của người dùng hiện tại */
  async getMyConnection(): Promise<MyLoveConnection | null> {
    const res = await apiClient<{ data: MyLoveConnection | null }>('/api/love/my-connection', {
      method: 'GET',
    });
    return res.data;
  },

  /** Lấy danh sách cột mốc kỷ niệm (hỗ trợ phân trang cursor) */
  async getMilestones(params?: {
    connectionId?: string;
    cursor?: string | null;
    limit?: number;
    order?: 'desc' | 'asc';
  }): Promise<LoveMilestonesApiResponse> {
    return apiClient<LoveMilestonesApiResponse>('/api/love/milestones', {
      method: 'GET',
      params: {
        ...(params?.limit ? { limit: String(params.limit) } : {}),
        ...(params?.order ? { order: params.order } : {}),
        ...(params?.connectionId ? { connectionId: params.connectionId } : {}),
        ...(params?.cursor ? { cursor: params.cursor } : {}),
      },
    });
  },

  /** Cập nhật ngày bắt đầu yêu / kỷ niệm */
  async updateAnniversary(payload: UpdateAnniversaryPayload): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/api/love/update-anniversary', {
      method: 'PATCH',
      body: payload,
    });
  },

  /** Tạo cột mốc kỷ niệm mới */
  async createMilestone(payload: CreateMilestonePayload): Promise<{ message: string; data: LoveMilestoneRow }> {
    return apiClient<{ message: string; data: LoveMilestoneRow }>('/api/love/milestones', {
      method: 'POST',
      body: payload,
    });
  },

  /** Sửa cột mốc kỷ niệm */
  async updateMilestone(id: string, payload: UpdateMilestonePayload): Promise<{ message: string; data: LoveMilestoneRow }> {
    return apiClient<{ message: string; data: LoveMilestoneRow }>(`/api/love/milestones/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  /** Xóa cột mốc kỷ niệm */
  async deleteMilestone(id: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>(`/api/love/milestones/${id}`, {
      method: 'DELETE',
    });
  },

  /** Cập nhật thông tin giao diện và avatar cặp đôi */
  async updateCustomize(payload: UpdateLoveCustomizePayload): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/api/love/customize', {
      method: 'PATCH',
      body: payload,
    });
  },

  /** Lấy chữ ký tải file lên Cloudinary (Client-side signed upload) */
  async getUploadSignature(payload: UploadSignaturePayload): Promise<UploadSignatureResponse> {
    return apiClient<UploadSignatureResponse>('/api/love/upload', {
      method: 'POST',
      body: payload,
    });
  },
};
