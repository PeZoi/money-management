'use client';

import { useQuery } from '@tanstack/react-query';
import type { AccountRow, TransactionWithCategory } from '@/types/database';
import { useWorkspaceStore } from './use-workspace';
import { transactionsApi, transactionKeys } from '@/lib/api/transactions';
import { accountsApi, accountKeys } from '@/lib/api/accounts';

/**
 * Hook fetch thông tin chi tiết một tài khoản
 */
export function useAccountDetail(id: string) {
  const { data: account, isLoading, error, refetch } = useQuery<AccountRow>({
    queryKey: accountKeys.detail(id),
    queryFn: async () => {
      if (!id) throw new Error('Thiếu id tài khoản');
      return accountsApi.get(id);
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
    queryKey: transactionKeys.accountTransactions(accountId, activeWorkspaceId, startDate, endDate),
    queryFn: async () => {
      if (!activeWorkspaceId || !accountId) return [];
      const res = await transactionsApi.list({
        workspace_id: activeWorkspaceId,
        account_id: accountId,
        month: 'all',
        limit: 'all',
        start_date: startDate,
        end_date: endDate,
      });
      return res.data ?? [];
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
