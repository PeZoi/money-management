import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { useWorkspaceStore } from './use-workspace';
import type { TransactionWithCategory } from '@/types/database';

export type TransactionFilter = {
  type?: 'all' | 'expense' | 'income';
  query?: string;
};

/**
 * Hook fetch danh sách giao dịch (GET /api/transactions)
 */
export function useTransactions() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!activeWorkspaceId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/transactions?workspace_id=${activeWorkspaceId}`);
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    fetchTransactions,
  };
}

/**
 * Hook tạo / xóa giao dịch
 */
export function useTransactionMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deleteTransaction = async (
    id: string,
    options?: { onSuccess?: () => void }
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Xóa thất bại');
      }
      toast.success('Đã xóa giao dịch');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa giao dịch';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createTransaction = async (
    payload: {
      amount: number;
      type: 'expense' | 'income';
      category_id?: string | null;
      note?: string | null;
      created_at?: string | null;
    },
    options?: { onSuccess?: () => void }
  ) => {
    if (!activeWorkspaceId) {
      toast.error('Không xác định được workspace.');
      return false;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, workspace_id: activeWorkspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Tạo thất bại');
      toast.success('Đã thêm giao dịch');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo giao dịch';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTransaction = async (
    id: string,
    payload: {
      amount: number;
      type: 'expense' | 'income';
      category_id?: string | null;
      note?: string | null;
      created_at?: string | null;
    },
    options?: { onSuccess?: () => void }
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cập nhật thất bại');
      toast.success('Đã cập nhật giao dịch');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật giao dịch';
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, deleteTransaction, createTransaction, updateTransaction };
}

