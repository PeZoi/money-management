'use client';

import { useState } from 'react';
import { useAccounts, useAccountMutation } from '@/hooks/use-accounts';
import type { AccountRow } from '@/types/database';
import { useConfirm } from '@/hooks/use-confirm';

export function useAccountsPage() {
  const { accounts, activeAccount, isLoading, fetchAccounts } = useAccounts();
  const { deleteAccount, activateAccount } = useAccountMutation();
  const confirm = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRow | null>(null);

  // Xử lý xóa tài khoản kèm theo xác nhận từ người dùng
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xóa tài khoản',
      message: 'Bạn có chắc chắn muốn xóa tài khoản này? Toàn bộ giao dịch liên kết với tài khoản này có thể bị ảnh hưởng.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
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
