'use client';

import { useState } from 'react';
import { useAccounts, useAccountMutation } from '@/hooks/use-accounts';
import type { AccountRow } from '@/types/database';

export function useAccountsPage() {
  const { accounts, activeAccount, isLoading, fetchAccounts } = useAccounts();
  const { deleteAccount, activateAccount } = useAccountMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);

  // Xử lý xóa tài khoản kèm theo xác nhận từ người dùng
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Bạn chắc chắn muốn xóa tài khoản này?');
    if (!confirmed) return;
    await deleteAccount(id, { onSuccess: fetchAccounts });
  };

  // Đặt tài khoản active mặc định để ghi chép giao dịch
  const handleActivate = async (id: string) => {
    await activateAccount(id, { onSuccess: fetchAccounts });
  };

  // Tính toán tổng số dư của toàn bộ tài khoản
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return {
    accounts,
    activeAccount,
    isLoading,
    fetchAccounts,
    createOpen,
    setCreateOpen,
    editingAccount,
    setEditingAccount,
    handleDelete,
    handleActivate,
    totalBalance,
  };
}
