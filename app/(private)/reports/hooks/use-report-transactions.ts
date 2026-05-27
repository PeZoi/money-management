'use client';

import { useQuery } from '@tanstack/react-query';

import type { TransactionWithCategory } from '@/types/database';
import { useWorkspaceStore } from '@/hooks/use-workspace';

/**
 * Hook fetch giao dịch cho trang báo cáo.
 * Khác với useTransactions ở chỗ nhận `month` từ bên ngoài
 * thay vì quản lý nội bộ, để đồng bộ với MonthPicker của report.
 */
export function useReportTransactions(month: string) {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: transactions = [], isLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ['report-transactions', activeWorkspaceId, month],
    queryFn: async () => {
      if (!activeWorkspaceId || !month) return [];
      const url = `/api/transactions?workspace_id=${activeWorkspaceId}&month=${month}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải danh sách giao dịch');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId && !!month,
  });

  return { transactions, isLoading };
}
