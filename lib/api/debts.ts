import { apiClient } from './client';
import type { DebtRow } from '@/types/database';

export interface CreateDebtPayload {
  workspace_id: string;
  debtor_name: string;
  amount: number;
  borrowed_at?: string;
  due_at?: string;
  status?: 'pending' | 'paid';
  note?: string | null;
  notified?: boolean;
}

export interface UpdateDebtPayload {
  debtor_name?: string;
  amount?: number;
  borrowed_at?: string;
  due_at?: string;
  status?: 'pending' | 'paid';
  note?: string | null;
  notified?: boolean;
}

/**
 * Query Key Factory cho feature Debts (Sổ nợ).
 * Giúp quản lý cache và invalidate queries chuẩn hóa, chống typo.
 */
export const debtKeys = {
  all: ['debts'] as const,
  workspace: (workspaceId?: string | null) => ['debts', workspaceId] as const,
  detail: (id?: string) => ['debt', id] as const,
};

/**
 * API client layer cho Feature Debts (Quản lý sổ nợ / người nợ).
 * Tập trung các cuộc gọi HTTP liên quan đến công nợ.
 */
export const debtsApi = {
  /** Lấy danh sách các khoản nợ của workspace */
  async list(workspace_id: string): Promise<DebtRow[]> {
    const res = await apiClient<{ data: DebtRow[] }>('/api/debts', {
      method: 'GET',
      params: { workspace_id },
    });
    return res.data ?? [];
  },

  /** Tạo mới một khoản nợ */
  async create(payload: CreateDebtPayload): Promise<DebtRow> {
    const res = await apiClient<{ data: DebtRow }>('/api/debts', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /** Cập nhật thông tin hoặc trạng thái trả nợ */
  async update(id: string, payload: UpdateDebtPayload): Promise<DebtRow> {
    const res = await apiClient<{ data: DebtRow }>(`/api/debts/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return res.data;
  },

  /** Xóa một khoản nợ */
  async delete(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/debts/${id}`, {
      method: 'DELETE',
    });
  },
};
