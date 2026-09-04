import { apiClient } from './client';
import type { CurrentUserSnapshot } from '@/types/user';

export const authKeys = {
  currentUser: () => ['auth', 'current-user'] as const,
};

/**
 * API client layer cho Feature Auth / User.
 * Tập trung các cuộc gọi liên quan đến phiên đăng nhập và thông tin người dùng.
 */
export const authApi = {
  /** Lấy thông tin user hiện tại kèm theo danh sách workspaces */
  async getCurrentUser(): Promise<CurrentUserSnapshot | null> {
    try {
      const res = await apiClient<{ data: CurrentUserSnapshot }>('/api/user/get-current-user', {
        method: 'GET',
      });
      return res.data ?? null;
    } catch {
      return null;
    }
  },
};
