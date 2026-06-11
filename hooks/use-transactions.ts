import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { TransactionWithCategory, AccountRow } from '@/types/database';
import type { CategoryUi } from '@/types/category';
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

  // Hàm helper dùng chung để làm mới (invalidate) tất cả các query liên quan đến giao dịch và ví
  const invalidateAllTransactionQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions-today', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions-report', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions-report-prev', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['report-transactions', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['report-config', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
  };

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
    onMutate: async (payload) => {
      const txQueryKeyFilter = { queryKey: ['transactions', activeWorkspaceId] };
      const accountsQueryKey = ['accounts', activeWorkspaceId];

      // Hủy mọi refetching đang diễn ra để tránh ghi đè dữ liệu cũ
      await queryClient.cancelQueries(txQueryKeyFilter);
      await queryClient.cancelQueries({ queryKey: accountsQueryKey });

      // Lưu snapshot cache cũ của transactions và accounts để rollback khi lỗi
      const previousTransactionsQueries = queryClient.getQueriesData<TransactionWithCategory[]>(txQueryKeyFilter);
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(accountsQueryKey);

      // Tìm kiếm thông tin category và account từ cache để tạo object hiển thị đầy đủ
      const categoryCache = queryClient.getQueryData<CategoryUi[]>(['categories', activeWorkspaceId]) || [];
      const accountCache = previousAccounts || [];

      const categoryObj = categoryCache.find(c => c.id === payload.category_id) || null;
      const categoryRelation = categoryObj ? {
        id: categoryObj.id,
        workspace_id: activeWorkspaceId || '',
        name: categoryObj.name,
        icon: categoryObj.icon,
        type: categoryObj.type,
        created_at: categoryObj.created_at || '',
        updated_at: categoryObj.updated_at || '',
      } : null;

      const accountObj = accountCache.find(a => a.id === payload.account_id) || null;
      const toAccountObj = accountCache.find(a => a.id === payload.to_account_id) || null;

      const createdDate = payload.created_at ? new Date(payload.created_at) : new Date();

      const optimisticTransaction: TransactionWithCategory = {
        id: `temp-tx-${Date.now()}`,
        workspace_id: activeWorkspaceId || '',
        amount: payload.amount,
        type: payload.type,
        category_id: payload.category_id || null,
        account_id: payload.account_id || null,
        to_account_id: payload.to_account_id || null,
        note: payload.note || null,
        created_by: '',
        created_at: createdDate.toISOString(),
        updated_at: new Date().toISOString(),
        category: categoryRelation,
        account: accountObj,
        to_account: toAccountObj,
      };

      // 1. Cập nhật lạc quan danh sách giao dịch
      previousTransactionsQueries.forEach(([queryKey, oldData]) => {
        if (!oldData) return;

        // Kiểm tra xem query này có filter theo month cụ thể không
        const queryMonth = queryKey[2];
        if (typeof queryMonth === 'string' && queryMonth !== 'all') {
          const txYearMonth = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          if (txYearMonth !== queryMonth) {
            return; // Không thuộc tháng này, bỏ qua
          }
        }

        const newData = [optimisticTransaction, ...oldData];
        newData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        queryClient.setQueryData(queryKey, newData);
      });

      // 2. Cập nhật lạc quan số dư tài khoản
      queryClient.setQueryData<AccountRow[]>(accountsQueryKey, (oldAccounts) => {
        if (!oldAccounts) return [];
        return oldAccounts.map((acc) => {
          let newBalance = Number(acc.balance);
          if (payload.type === 'expense' && acc.id === payload.account_id) {
            newBalance -= payload.amount;
          } else if (payload.type === 'income' && acc.id === payload.account_id) {
            newBalance += payload.amount;
          } else if (payload.type === 'transfer') {
            if (acc.id === payload.account_id) {
              newBalance -= payload.amount;
            }
            if (acc.id === payload.to_account_id) {
              newBalance += payload.amount;
            }
          }
          return { ...acc, balance: newBalance };
        });
      });

      return { previousTransactionsQueries, previousAccounts };
    },
    onError: (err: Error, newTx, context) => {
      // Rollback lại dữ liệu cũ khi lỗi
      if (context?.previousTransactionsQueries) {
        context.previousTransactionsQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể tạo giao dịch');
    },
    onSuccess: () => {
      toast.success('Đã thêm giao dịch');
    },
    onSettled: () => {
      invalidateAllTransactionQueries();
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
    onMutate: async ({ id, payload }) => {
      const txQueryKeyFilter = { queryKey: ['transactions', activeWorkspaceId] };
      const accountsQueryKey = ['accounts', activeWorkspaceId];

      await queryClient.cancelQueries(txQueryKeyFilter);
      await queryClient.cancelQueries({ queryKey: accountsQueryKey });

      const previousTransactionsQueries = queryClient.getQueriesData<TransactionWithCategory[]>(txQueryKeyFilter);
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(accountsQueryKey);

      // Tìm giao dịch cũ trước khi chỉnh sửa trong cache
      let oldTx: TransactionWithCategory | undefined;
      for (const [, data] of previousTransactionsQueries) {
        if (data) {
          const found = data.find(t => t.id === id);
          if (found) {
            oldTx = found;
            break;
          }
        }
      }

      // 1. Cập nhật lạc quan số dư tài khoản (Hoàn lại giao dịch cũ, áp dụng giao dịch mới)
      queryClient.setQueryData<AccountRow[]>(accountsQueryKey, (oldAccounts) => {
        if (!oldAccounts) return [];
        let updatedAccounts = [...oldAccounts];

        if (oldTx) {
          // Hoàn lại số dư ví cũ
          updatedAccounts = updatedAccounts.map(acc => {
            let balance = Number(acc.balance);
            if (oldTx.type === 'expense' && acc.id === oldTx.account_id) {
              balance += Number(oldTx.amount);
            } else if (oldTx.type === 'income' && acc.id === oldTx.account_id) {
              balance -= Number(oldTx.amount);
            } else if (oldTx.type === 'transfer') {
              if (acc.id === oldTx.account_id) balance += Number(oldTx.amount);
              if (acc.id === oldTx.to_account_id) balance -= Number(oldTx.amount);
            }
            return { ...acc, balance };
          });
        }

        // Áp dụng số dư ví mới
        const newType = oldTx?.type || 'expense';
        const newAmount = payload.amount !== undefined ? payload.amount : (oldTx ? Number(oldTx.amount) : 0);
        const newAccountId = payload.account_id !== undefined ? payload.account_id : oldTx?.account_id;
        const newToAccountId = payload.to_account_id !== undefined ? payload.to_account_id : oldTx?.to_account_id;

        updatedAccounts = updatedAccounts.map(acc => {
          let balance = Number(acc.balance);
          if (newType === 'expense' && acc.id === newAccountId) {
            balance -= newAmount;
          } else if (newType === 'income' && acc.id === newAccountId) {
            balance += newAmount;
          } else if (newType === 'transfer') {
            if (acc.id === newAccountId) balance -= newAmount;
            if (acc.id === newToAccountId) balance += newAmount;
          }
          return { ...acc, balance };
        });

        return updatedAccounts;
      });

      // 2. Cập nhật lạc quan danh sách giao dịch
      queryClient.setQueriesData<TransactionWithCategory[]>(txQueryKeyFilter, (oldData) => {
        if (!oldData) return [];
        const categoryCache = queryClient.getQueryData<CategoryUi[]>(['categories', activeWorkspaceId]) || [];
        const accountCache = queryClient.getQueryData<AccountRow[]>(accountsQueryKey) || [];

        return oldData.map((tx) => {
          if (tx.id !== id) return tx;

          const catId = payload.category_id !== undefined ? payload.category_id : tx.category_id;
          const accId = payload.account_id !== undefined ? payload.account_id : tx.account_id;
          const toAccId = payload.to_account_id !== undefined ? payload.to_account_id : tx.to_account_id;

          const categoryObj = categoryCache.find(c => c.id === catId) || null;
          const categoryRelation = categoryObj ? {
            id: categoryObj.id,
            workspace_id: activeWorkspaceId || '',
            name: categoryObj.name,
            icon: categoryObj.icon,
            type: categoryObj.type,
            created_at: categoryObj.created_at || '',
            updated_at: categoryObj.updated_at || '',
          } : null;

          const accountObj = accountCache.find(a => a.id === accId) || null;
          const toAccountObj = accountCache.find(a => a.id === toAccId) || null;

          return {
            ...tx,
            amount: payload.amount !== undefined ? payload.amount : tx.amount,
            category_id: catId,
            account_id: accId,
            to_account_id: toAccId,
            note: payload.note !== undefined ? payload.note : tx.note,
            created_at: payload.created_at !== undefined && payload.created_at !== null ? new Date(payload.created_at).toISOString() : tx.created_at,
            updated_at: new Date().toISOString(),
            category: categoryRelation,
            account: accountObj,
            to_account: toAccountObj,
          };
        });
      });

      return { previousTransactionsQueries, previousAccounts };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousTransactionsQueries) {
        context.previousTransactionsQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể cập nhật giao dịch');
    },
    onSuccess: () => {
      toast.success('Đã cập nhật giao dịch');
    },
    onSettled: () => {
      invalidateAllTransactionQueries();
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
    onMutate: async (id) => {
      const txQueryKeyFilter = { queryKey: ['transactions', activeWorkspaceId] };
      const accountsQueryKey = ['accounts', activeWorkspaceId];

      await queryClient.cancelQueries(txQueryKeyFilter);
      await queryClient.cancelQueries({ queryKey: accountsQueryKey });

      const previousTransactionsQueries = queryClient.getQueriesData<TransactionWithCategory[]>(txQueryKeyFilter);
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(accountsQueryKey);

      // Tìm giao dịch cũ để hoàn trả số dư ví
      let oldTx: TransactionWithCategory | undefined;
      for (const [, data] of previousTransactionsQueries) {
        if (data) {
          const found = data.find(t => t.id === id);
          if (found) {
            oldTx = found;
            break;
          }
        }
      }

      // 1. Cập nhật lạc quan số dư ví (Hoàn trả số tiền giao dịch bị xóa)
      queryClient.setQueryData<AccountRow[]>(accountsQueryKey, (oldAccounts) => {
        if (!oldAccounts) return [];
        if (!oldTx) return oldAccounts;

        return oldAccounts.map(acc => {
          let balance = Number(acc.balance);
          if (oldTx.type === 'expense' && acc.id === oldTx.account_id) {
            balance += Number(oldTx.amount);
          } else if (oldTx.type === 'income' && acc.id === oldTx.account_id) {
            balance -= Number(oldTx.amount);
          } else if (oldTx.type === 'transfer') {
            if (acc.id === oldTx.account_id) balance += Number(oldTx.amount);
            if (acc.id === oldTx.to_account_id) balance -= Number(oldTx.amount);
          }
          return { ...acc, balance };
        });
      });

      // 2. Cập nhật lạc quan danh sách giao dịch (Xóa khỏi danh sách)
      queryClient.setQueriesData<TransactionWithCategory[]>(txQueryKeyFilter, (oldData) => {
        if (!oldData) return [];
        return oldData.filter(tx => tx.id !== id);
      });

      return { previousTransactionsQueries, previousAccounts };
    },
    onError: (err: Error, id, context) => {
      if (context?.previousTransactionsQueries) {
        context.previousTransactionsQueries.forEach(([queryKey, oldData]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể xóa giao dịch');
    },
    onSuccess: () => {
      toast.success('Đã xóa giao dịch');
    },
    onSettled: () => {
      invalidateAllTransactionQueries();
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

