'use client';

import { useQuery } from '@tanstack/react-query';

import type { TransactionWithCategory } from '@/types/database';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { transactionsApi, transactionKeys } from '@/lib/api/transactions';

/**
 * Hook fetch giao dịch cho trang báo cáo.
 * Khác với useTransactions ở chỗ nhận `month` từ bên ngoài
 * thay vì quản lý nội bộ, để đồng bộ với MonthPicker của report.
 */
export function useReportTransactions(month: string) {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: transactions = [], isLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: transactionKeys.reportMonth(activeWorkspaceId, month),
    queryFn: async () => {
      if (!activeWorkspaceId || !month) return [];
      const res = await transactionsApi.list({
        workspace_id: activeWorkspaceId,
        month,
        limit: 'all',
      });
      return res.data || [];
    },
    enabled: !!activeWorkspaceId && !!month,
  });

  return { transactions, isLoading };
}
