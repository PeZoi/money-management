import { apiClient } from './client';
import type { CategoryUi, CategoryType } from '@/types/category';
import type { TransactionType } from '@/types/database';

export interface CreateCategoryPayload {
  workspace_id: string;
  name: string;
  icon: string;
  type: TransactionType | CategoryType;
}

export interface UpdateCategoryPayload {
  name?: string;
  icon?: string;
  type?: TransactionType | CategoryType;
}

export interface GetCategoriesParams {
  workspace_id: string;
  type?: string;
  [key: string]: string | undefined;
}

/**
 * Query Key Factory cho feature Categories.
 * Giúp quản lý cache và invalidate queries chuẩn hóa, chống typo.
 */
export const categoryKeys = {
  all: ['categories'] as const,
  workspace: (workspaceId?: string | null, type?: string) =>
    [...categoryKeys.all, workspaceId, ...(type ? [type] : [])] as const,
  detail: (id?: string) => ['category', id] as const,
};

/**
 * API client layer cho Feature Categories.
 * Tập trung toàn bộ các cuộc gọi HTTP liên quan đến danh mục thu chi.
 */
export const categoriesApi = {
  /** Lấy danh sách danh mục theo workspace và loại (tuỳ chọn) */
  async list(params: string | GetCategoriesParams): Promise<CategoryUi[]> {
    const queryParams = typeof params === 'string' ? { workspace_id: params } : { ...params };
    const res = await apiClient<{ data: CategoryUi[] }>('/api/categories', {
      method: 'GET',
      params: queryParams,
    });
    return res.data ?? [];
  },

  /** Lấy thông tin chi tiết một danh mục */
  async get(id: string): Promise<CategoryUi> {
    const res = await apiClient<{ data: CategoryUi }>(`/api/categories/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  /** Tạo mới một danh mục */
  async create(payload: CreateCategoryPayload): Promise<CategoryUi> {
    const res = await apiClient<{ data: CategoryUi }>('/api/categories', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /** Tạo hàng loạt danh mục (Bulk insert / Mặc định) */
  async createBulk(payload: CreateCategoryPayload[]): Promise<CategoryUi[]> {
    const res = await apiClient<{ data: CategoryUi[] }>('/api/categories', {
      method: 'POST',
      body: payload,
    });
    return res.data ?? [];
  },

  /** Cập nhật một danh mục hiện có */
  async update(id: string, payload: UpdateCategoryPayload): Promise<CategoryUi> {
    const res = await apiClient<{ data: CategoryUi }>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: payload,
    });
    return res.data;
  },

  /** Xóa một danh mục */
  async delete(id: string): Promise<{ id: string }> {
    const res = await apiClient<{ data: { id: string } }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
