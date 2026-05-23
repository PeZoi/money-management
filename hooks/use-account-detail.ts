'use client';

import { useQuery } from '@tanstack/react-query';
import type { AccountRow, TransactionWithCategory } from '@/types/database';
import { useWorkspaceStore } from './use-workspace';

/**
 * Hook fetch thông tin chi tiết một tài khoản
 */
export function useAccountDetail(id: string) {
  const { data: account, isLoading, error, refetch } = useQuery<AccountRow>({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) throw new Error('Thiếu id tài khoản');
      const res = await fetch(`/api/accounts/${id}`);
      if (!res.ok) throw new Error('Không thể tải thông tin tài khoản');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Lỗi tải thông tin');
      return json.data;
    },
    enabled: !!id,
  });

  return {
    account,
    isLoading,
    error: error as Error | null,
    refetchAccount: refetch,
  };
}

/**
 * Hook fetch các giao dịch của tài khoản trong khoảng thời gian nhất định
 */
export function useAccountTransactions({
  accountId,
  startDate,
  endDate,
}: {
  accountId: string;
  startDate?: string;
  endDate?: string;
}) {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: transactions = [], isLoading, error, refetch } = useQuery<TransactionWithCategory[]>({
    queryKey: ['account-transactions', accountId, activeWorkspaceId, startDate, endDate],
    queryFn: async () => {
      if (!activeWorkspaceId || !accountId) return [];
      let url = `/api/transactions?workspace_id=${activeWorkspaceId}&account_id=${accountId}&month=all`;
      if (startDate) {
        url += `&start_date=${encodeURIComponent(startDate)}`;
      }
      if (endDate) {
        url += `&end_date=${encodeURIComponent(endDate)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải danh sách giao dịch của tài khoản');
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!activeWorkspaceId && !!accountId,
  });

  return {
    transactions,
    isLoading,
    error: error as Error | null,
    refetchTransactions: refetch,
  };
}
