import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { TransactionWithCategory } from '@/types/database';
import { useWorkspaceStore } from './use-workspace';

export type TransactionFilter = {
  type?: 'all' | 'expense' | 'income' | 'transfer';
  query?: string;
};

/**
 * Hook fetch danh sách giao dịch (GET /api/transactions)
 */
export function useTransactions() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const { data: transactions = [], isLoading, refetch } = useQuery<TransactionWithCategory[]>({
    queryKey: ['transactions', activeWorkspaceId, month],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const url = `/api/transactions?workspace_id=${activeWorkspaceId}${month ? `&month=${month}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải danh sách giao dịch');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId,
  });

  return {
    transactions,
    isLoading,
    fetchTransactions: refetch, // Giữ tương thích cho UI gọi
    month,
    setMonth,
  };
}

/**
 * Hook tạo / xóa giao dịch
 */
export function useTransactionMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: {
      amount: number;
      type: 'expense' | 'income' | 'transfer';
      category_id?: string | null;
      account_id?: string | null;
      to_account_id?: string | null;
      note?: string | null;
      created_at?: string | null;
    }) => {
      if (!activeWorkspaceId) {
        throw new Error('Không xác định được workspace.');
      }
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, workspace_id: activeWorkspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Tạo thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Đã thêm giao dịch');
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể tạo giao dịch');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        amount: number;
        category_id?: string | null;
        account_id?: string | null;
        to_account_id?: string | null;
        note?: string | null;
        created_at?: string | null;
      };
    }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cập nhật thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật giao dịch');
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể cập nhật giao dịch');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Xóa thất bại');
      }
      return true;
    },
    onSuccess: () => {
      toast.success('Đã xóa giao dịch');
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể xóa giao dịch');
    }
  });

  const createTransaction = async (
    payload: {
      amount: number;
      type: 'expense' | 'income' | 'transfer';
      category_id?: string | null;
      account_id?: string | null;
      to_account_id?: string | null;
      note?: string | null;
      created_at?: string | null;
    },
    options?: { onSuccess?: () => void }
  ) => {
    try {
      await createMutation.mutateAsync(payload);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const updateTransaction = async (
    id: string,
    payload: {
      amount: number;
      category_id?: string | null;
      account_id?: string | null;
      to_account_id?: string | null;
      note?: string | null;
      created_at?: string | null;
    },
    options?: { onSuccess?: () => void }
  ) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const deleteTransaction = async (
    id: string,
    options?: { onSuccess?: () => void }
  ) => {
    try {
      await deleteMutation.mutateAsync(id);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return { isSubmitting, deleteTransaction, createTransaction, updateTransaction };
}

/**
 * Hook lấy danh sách gợi ý tên giao dịch dựa trên lịch sử
 */
export function useTransactionSuggestions() {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ['transaction-suggestions', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const res = await fetch(`/api/transactions?workspace_id=${activeWorkspaceId}&month=all`);
      if (!res.ok) throw new Error('Không thể tải lịch sử giao dịch để gợi ý');
      const json = await res.json();
      const list: TransactionWithCategory[] = json.data || [];
      
      // Lọc các note không rỗng, chuẩn hóa và đếm tần suất xuất hiện
      const notesMap = new Map<string, number>();
      list.forEach((t) => {
        const note = t.note?.trim();
        if (note) {
          notesMap.set(note, (notesMap.get(note) || 0) + 1);
        }
      });
      
      // Sắp xếp các note theo tần suất xuất hiện giảm dần
      return Array.from(notesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map((entry) => entry[0]);
    },
    enabled: !!activeWorkspaceId,
    staleTime: 1000 * 60 * 5, // 5 phút cache
  });

  return { suggestions };
}

