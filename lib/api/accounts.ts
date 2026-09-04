import { apiClient } from './client';
import type { AccountRow, AccountType } from '@/types/database';

export interface CreateAccountPayload {
  workspace_id: string;
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  is_system?: boolean;
}

export interface UpdateAccountPayload {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  icon?: string;
  color?: string;
  is_system?: boolean;
}

/**
 * Query Key Factory cho feature Accounts.
 * Giúp quản lý cache và invalidate queries chuẩn hóa, chống typo.
 */
export const accountKeys = {
  all: ['accounts'] as const,
  workspace: (workspaceId?: string | null) => ['accounts', workspaceId] as const,
  detail: (id?: string) => ['account', id] as const,
};

/**
 * API client layer cho Feature Accounts.
 * Tập trung toàn bộ các cuộc gọi HTTP liên quan đến tài khoản.
 */
export const accountsApi = {
  /** Lấy danh sách tài khoản theo workspace */
  async list(workspace_id: string): Promise<AccountRow[]> {
    const res = await apiClient<{ success: boolean; data: AccountRow[] }>('/api/accounts', {
      method: 'GET',
      params: { workspace_id },
    });
    return res.data ?? [];
  },

  /** Lấy thông tin chi tiết một tài khoản */
  async get(id: string): Promise<AccountRow> {
    const res = await apiClient<{ success: boolean; data: AccountRow }>(`/api/accounts/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  /** Tạo mới một tài khoản */
  async create(payload: CreateAccountPayload): Promise<AccountRow> {
    const res = await apiClient<{ success: boolean; data: AccountRow }>('/api/accounts', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /** Cập nhật thông tin tài khoản */
  async update(id: string, payload: UpdateAccountPayload): Promise<AccountRow> {
    const res = await apiClient<{ success: boolean; data: AccountRow }>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: payload,
    });
    return res.data;
  },

  /** Xóa một tài khoản (kiểm tra an toàn RPC phía server) */
  async delete(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  /** Đặt tài khoản làm active mặc định trong workspace */
  async activate(id: string): Promise<AccountRow> {
    const res = await apiClient<{ success: boolean; data: AccountRow }>(`/api/accounts/${id}/activate`, {
      method: 'POST',
    });
    return res.data;
  },
};
