import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { AccountRow, AccountType } from '@/types/database';
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
      is_system?: boolean;
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
    onMutate: async (newAccountPayload) => {
      // Hủy mọi query đang chạy của accounts để tránh ghi đè dữ liệu cũ
      await queryClient.cancelQueries({ queryKey: ['accounts', activeWorkspaceId] });

      // Lưu lại snapshot cũ để phục hồi khi lỗi
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(['accounts', activeWorkspaceId]);

      // Tạo object tài khoản giả định
      const optimisticAccount: AccountRow = {
        id: `temp-account-${Date.now()}`,
        workspace_id: activeWorkspaceId || '',
        name: newAccountPayload.name,
        type: newAccountPayload.type as AccountType,
        balance: newAccountPayload.balance ?? 0,
        currency: newAccountPayload.currency ?? 'VND',
        icon: newAccountPayload.icon ?? 'Wallet',
        color: newAccountPayload.color ?? '#94a3b8',
        is_active: false,
        is_system: newAccountPayload.is_system ?? true,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Cập nhật lạc quan cache
      queryClient.setQueryData<AccountRow[]>(['accounts', activeWorkspaceId], (old) => {
        return old ? [...old, optimisticAccount] : [optimisticAccount];
      });

      return { previousAccounts };
    },
    onError: (err: Error, newAccount, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể tạo tài khoản');
    },
    onSuccess: () => {
      toast.success('Đã tạo tài khoản');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', activeWorkspaceId] });
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(['accounts', activeWorkspaceId]);

      // Cập nhật lạc quan thông tin tài khoản trong cache
      queryClient.setQueryData<AccountRow[]>(['accounts', activeWorkspaceId], (old) => {
        if (!old) return [];
        return old.map((acc) => (acc.id === id ? { ...acc, ...payload } : acc));
      });

      return { previousAccounts };
    },
    onError: (err: Error, variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể cập nhật tài khoản');
    },
    onSuccess: () => {
      toast.success('Đã cập nhật tài khoản');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report-prev', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-today', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', activeWorkspaceId] });
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(['accounts', activeWorkspaceId]);

      // Xóa lạc quan tài khoản khỏi cache
      queryClient.setQueryData<AccountRow[]>(['accounts', activeWorkspaceId], (old) => {
        if (!old) return [];
        return old.filter((acc) => acc.id !== id);
      });

      return { previousAccounts };
    },
    onError: (err: Error, id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể xóa tài khoản');
    },
    onSuccess: () => {
      toast.success('Đã xóa tài khoản');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report-prev', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-today', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/accounts/${id}/activate`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Kích hoạt thất bại');
      return json;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', activeWorkspaceId] });
      const previousAccounts = queryClient.getQueryData<AccountRow[]>(['accounts', activeWorkspaceId]);

      // Kích hoạt lạc quan trên cache (chuyển tất cả về false và chỉ kích hoạt tài khoản được chọn)
      queryClient.setQueryData<AccountRow[]>(['accounts', activeWorkspaceId], (old) => {
        if (!old) return [];
        return old.map((acc) => ({ ...acc, is_active: acc.id === id }));
      });

      return { previousAccounts };
    },
    onError: (err: Error, id, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', activeWorkspaceId], context.previousAccounts);
      }
      toast.error(err.message || 'Không thể kích hoạt tài khoản');
    },
    onSuccess: () => {
      toast.success('Đã chọn tài khoản active');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-report-prev', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions-today', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
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
      is_system?: boolean;
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
      is_system?: boolean;
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
