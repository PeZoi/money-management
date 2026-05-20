import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { AccountRow } from '@/types/database';
import { useWorkspaceStore } from './use-workspace';

/**
 * Hook fetch và quản lý danh sách tài khoản
 */
export function useAccounts() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!activeWorkspaceId) {
      setAccounts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/accounts?workspace_id=${activeWorkspaceId}`);
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts();
  }, [fetchAccounts]);

  // Tài khoản đang active (is_active = true)
  const activeAccount = accounts.find((a) => a.is_active) ?? null;

  return { accounts, activeAccount, isLoading, fetchAccounts };
}

/**
 * Hook mutation: tạo, sửa, xóa, kích hoạt tài khoản
 */
export function useAccountMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAccount = async (
    payload: {
      name: string;
      type: string;
      balance?: number;
      currency?: string;
      icon?: string;
      color?: string;
    },
    options?: { onSuccess?: () => void }
  ) => {
    if (!activeWorkspaceId) {
      toast.error('Không xác định được workspace.');
      return false;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, workspace_id: activeWorkspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Tạo thất bại');
      toast.success('Đã tạo tài khoản');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo tài khoản');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAccount = async (
    id: string,
    payload: {
      name?: string;
      type?: string;
      balance?: number;
      currency?: string;
      icon?: string;
      color?: string;
    },
    options?: { onSuccess?: () => void }
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại');
      toast.success('Đã cập nhật tài khoản');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật tài khoản');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAccount = async (id: string, options?: { onSuccess?: () => void }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Xóa thất bại');
      }
      toast.success('Đã xóa tài khoản');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xóa tài khoản');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const activateAccount = async (id: string, options?: { onSuccess?: () => void }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${id}/activate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Kích hoạt thất bại');
      toast.success('Đã chọn tài khoản active');
      options?.onSuccess?.();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể kích hoạt tài khoản');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createAccount, updateAccount, deleteAccount, activateAccount };
}
