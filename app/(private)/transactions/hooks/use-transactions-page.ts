'use client';

import { useConfirm } from '@/hooks/use-confirm';
import { useDraggable } from '@/hooks/use-draggable';
import { useTransactionMutation, useTransactions } from '@/hooks/use-transactions';
import type { TransactionType, TransactionWithCategory } from '@/types/database';
import { useMemo, useState } from 'react';
import { normalizeText, typeLabel } from '../transaction-ui';
import { useAccounts } from '@/hooks/use-accounts';
import { getTransactionSystemImpact } from '@/lib/utils';

export type FilterType = 'all' | TransactionType;
export type SortOption = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export function useTransactionsPage() {
  const { transactions, isLoading, fetchTransactions, month, setMonth } = useTransactions();
  const { deleteTransaction } = useTransactionMutation();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);

  // Sử dụng hook kéo thả mượt mà cho nút FAB
  const { ref: fabRef, dragInfo, handleDragStart } = useDraggable();

  const { accounts } = useAccounts();

  // Lọc và sắp xếp dữ liệu
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    const safeAccounts = accounts || [];

    let list = transactions.filter((t) => {
      const impact = getTransactionSystemImpact(t, safeAccounts);

      if (typeFilter !== 'all') {
        if (typeFilter === 'transfer') {
          // Chỉ lấy chuyển khoản nội bộ (System -> System hoặc Non-system -> Non-system)
          if (t.type !== 'transfer' || impact.type !== 'none') return false;
        } else {
          // Lấy theo impact thực tế (ví dụ: transfer ví ngoài được xem là expense)
          if (impact.type !== typeFilter) return false;
        }
      }

      if (!q) return true;
      const hay = normalizeText(
        `${t.category?.name ?? ''} ${t.note ?? ''} ${typeLabel(t.type)}`
      );
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sort === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return list;
  }, [transactions, query, typeFilter, sort]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xóa giao dịch',
      message: 'Bạn có chắc chắn muốn xóa giao dịch này không? Số dư tài khoản liên kết sẽ tự động được hoàn lại.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteTransaction(id, { onSuccess: fetchTransactions });
  };

  return {
    transactions,
    isLoading,
    fetchTransactions,
    month,
    setMonth,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    createOpen,
    setCreateOpen,
    updateOpen,
    setUpdateOpen,
    selectedTransaction,
    setSelectedTransaction,
    fabRef,
    dragInfo,
    handleDragStart,
    filtered,
    handleDelete,
  };
}
