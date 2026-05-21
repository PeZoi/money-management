import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { AccountRow } from '@/types/database';
import { useWorkspaceStore } from './use-workspace';

/**
 * Hook fetch và quản lý danh sách tài khoản
 */
export function useAccounts() {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: accounts = [], isLoading, refetch } = useQuery<AccountRow[]>({
    queryKey: ['accounts', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const res = await fetch(`/api/accounts?workspace_id=${activeWorkspaceId}`);
      if (!res.ok) throw new Error('Không thể tải danh sách tài khoản');
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!activeWorkspaceId,
  });

  // Tài khoản đang active (is_active = true)
  const activeAccount = accounts.find((a) => a.is_active) ?? null;

  return { 
    accounts, 
    activeAccount, 
    isLoading, 
    fetchAccounts: refetch 
  };
}

/**
 * Hook mutation: tạo, sửa, xóa, kích hoạt tài khoản
 */
export function useAccountMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      type: string;
      balance?: number;
      currency?: string;
      icon?: string;
      color?: string;
    }) => {
      if (!activeWorkspaceId) throw new Error('Không xác định được workspace.');
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, workspace_id: activeWorkspaceId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Tạo thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Đã tạo tài khoản');
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể tạo tài khoản');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Đã cập nhật tài khoản');
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể cập nhật tài khoản');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Xóa thất bại');
      }
      return true;
    },
    onSuccess: () => {
      toast.success('Đã xóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể xóa tài khoản');
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}/activate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Kích hoạt thất bại');
      return json;
    },
    onSuccess: () => {
      toast.success('Đã chọn tài khoản active');
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể kích hoạt tài khoản');
    }
  });

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
    try {
      await createMutation.mutateAsync(payload);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
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
    try {
      await updateMutation.mutateAsync({ id, payload });
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const deleteAccount = async (id: string, options?: { onSuccess?: () => void }) => {
    try {
      await deleteMutation.mutateAsync(id);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const activateAccount = async (id: string, options?: { onSuccess?: () => void }) => {
    try {
      await activateMutation.mutateAsync(id);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || activateMutation.isPending;

  return { isSubmitting, createAccount, updateAccount, deleteAccount, activateAccount };
}
