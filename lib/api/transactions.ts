import { apiClient } from './client';
import type { TransactionType, TransactionWithCategory } from '@/types/database';

export interface TransactionsApiResponse {
  data: TransactionWithCategory[];
  next_cursor: string | null;
  has_more: boolean;
  total_count: number | null;
}

export interface GetTransactionsParams {
  workspace_id: string;
  month?: string;
  start_date?: string;
  end_date?: string;
  type?: string;
  category_id?: string;
  account_id?: string;
  cursor?: string | null;
  limit?: number | 'all';
  paginate?: boolean;
}

export interface CreateTransactionPayload {
  workspace_id: string;
  amount: number;
  type: TransactionType;
  category_id?: string | null;
  account_id?: string | null;
  to_account_id?: string | null;
  note?: string | null;
  created_at?: string | null;
}

export interface UpdateTransactionPayload {
  amount?: number;
  category_id?: string | null;
  account_id?: string | null;
  to_account_id?: string | null;
  note?: string | null;
  created_at?: string | null;
}

export interface FundContributionPayload {
  personal_workspace_id: string;
  personal_account_id: string;
  group_workspace_id: string;
  group_account_id: string;
  amount: number;
  note?: string;
}

export interface ResetTransactionsPayload {
  workspace_id: string;
  range: 'all' | 'day' | 'month' | 'year';
  value?: string;
  keep_balance?: boolean;
}

export interface ParseCategoryItem {
  name: string;
  type: string;
}

export interface ParseTransactionPayload {
  text: string;
  categories?: ParseCategoryItem[];
}

export interface ParsedTransactionData {
  amount: number | null;
  type: 'expense' | 'income';
  category_suggestion?: string | null;
  clean_note?: string;
}

/**
 * Query Key Factory cho feature Transactions.
 * Giúp quản lý cache và invalidate queries một cách chuẩn hóa, chống typo.
 */
export const transactionKeys = {
  all: ['transactions'] as const,
  workspace: (workspaceId?: string | null) => [...transactionKeys.all, workspaceId] as const,
  list: (workspaceId?: string | null, params?: Record<string, unknown>) =>
    [...transactionKeys.workspace(workspaceId), 'list', params] as const,
  infinite: (workspaceId?: string | null, params?: Record<string, unknown>) =>
    ['transactions-infinite', workspaceId, params] as const,
  report: (workspaceId?: string | null, range?: string, start?: string, end?: string) =>
    ['transactions-report', workspaceId, range, start, end] as const,
  reportPrev: (workspaceId?: string | null, range?: string, start?: string, end?: string) =>
    ['transactions-report-prev', workspaceId, range, start, end] as const,
  today: (workspaceId?: string | null) =>
    ['transactions-today', workspaceId] as const,
  monthStats: (workspaceId?: string | null, month?: string) =>
    ['transactions-month-stats', workspaceId, month] as const,
  reportMonth: (workspaceId?: string | null, month?: string) =>
    ['report-transactions', workspaceId, month] as const,
  accountTransactions: (accountId?: string, workspaceId?: string | null, startDate?: string, endDate?: string) =>
    ['account-transactions', accountId, workspaceId, startDate, endDate] as const,
  suggestions: (workspaceId?: string | null) =>
    ['transaction-suggestions', workspaceId] as const,
};

/**
 * API client layer cho Feature Transactions.
 * Tập trung toàn bộ các cuộc gọi HTTP liên quan đến giao dịch.
 */
export const transactionsApi = {
  /** Lấy danh sách giao dịch với bộ lọc, phân trang hoặc lấy toàn bộ */
  async list(params: GetTransactionsParams): Promise<TransactionsApiResponse> {
    const { paginate, ...rest } = params;
    return apiClient<TransactionsApiResponse>('/api/transactions', {
      method: 'GET',
      params: {
        ...rest,
        ...(paginate !== undefined ? { paginate: String(paginate) } : {}),
      },
    });
  },

  /** Tạo mới một giao dịch */
  async create(payload: CreateTransactionPayload): Promise<{ data: TransactionWithCategory }> {
    return apiClient<{ data: TransactionWithCategory }>('/api/transactions', {
      method: 'POST',
      body: payload,
    });
  },

  /** Cập nhật một giao dịch hiện có */
  async update(id: string, payload: UpdateTransactionPayload): Promise<{ data: TransactionWithCategory }> {
    return apiClient<{ data: TransactionWithCategory }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  /** Xóa một giao dịch */
  async delete(id: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },

  /** Reset toàn bộ hoặc một phần giao dịch của workspace cá nhân */
  async reset(payload: ResetTransactionsPayload): Promise<{ success: boolean; deleted_count: number }> {
    return apiClient<{ success: boolean; deleted_count: number }>('/api/transactions/reset', {
      method: 'POST',
      body: payload,
    });
  },

  /** Phân tích câu nói/văn bản tự nhiên thành giao dịch (AI Parser) */
  async parse(payload: ParseTransactionPayload): Promise<{ success: boolean; data: ParsedTransactionData }> {
    return apiClient<{ success: boolean; data: ParsedTransactionData }>('/api/transactions/parse', {
      method: 'POST',
      body: payload,
    });
  },

  /** Đóng góp tiền vào quỹ chung từ một tài khoản thành viên */
  async contributeFund(payload: FundContributionPayload): Promise<{ success: boolean; data: unknown }> {
    return apiClient<{ success: boolean; data: unknown }>('/api/transactions/fund-contribution', {
      method: 'POST',
      body: payload,
    });
  },
};
