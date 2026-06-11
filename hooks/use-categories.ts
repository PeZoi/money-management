import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  categoryDefaultValues,
  type CategoryFormValues,
  categorySchema,
} from '@/lib/validations/category-schema';
import { CategoryType, CategoryUi } from '@/types/category';
import { useWorkspaceStore } from './use-workspace';


/**
 * Hook chuyên xử lý việc lấy danh sách danh mục (GET)
 */
export function useCategories() {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: categories = [], isLoading, refetch } = useQuery<CategoryUi[]>({
    queryKey: ['categories', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const res = await fetch(`/api/categories?workspace_id=${activeWorkspaceId}`);
      if (!res.ok) throw new Error('Không thể tải danh mục');
      const json = await res.json();

      return json.data || [];
    },
    enabled: !!activeWorkspaceId,
  });

  return {
    categories,
    isLoading,
    fetchCategories: refetch, // Giữ backward compatibility cho các file gọi hook
  };
}

/**
 * Hook chuyên xử lý việc thêm/sửa danh mục (POST/PATCH)
 */
export function useCategoryMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      payload,
      options,
    }: {
      payload: Record<string, unknown>;
      options?: {
        categoryId?: string;
        isUpdate?: boolean;
        workspaceId?: string;
        onSuccess?: () => void;
        onError?: (err: Error) => void;
      };
    }) => {
      const { categoryId, isUpdate, workspaceId } = options || {};
      const finalWorkspaceId = workspaceId || activeWorkspaceId;

      if (!isUpdate && !finalWorkspaceId) {
        throw new Error('Lỗi hệ thống: Không xác định được workspace đang hoạt động.');
      }

      const url = isUpdate ? `/api/categories/${categoryId}` : '/api/categories';
      const method = isUpdate ? 'PATCH' : 'POST';

      const finalPayload = { ...payload };
      if (!isUpdate) {
        finalPayload.workspace_id = finalWorkspaceId;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Đã có lỗi xảy ra');
      }

      return result;
    },
    onMutate: async (variables) => {
      const { payload, options } = variables;
      const isUpdate = options?.isUpdate;
      const categoryId = options?.categoryId;
      const finalWorkspaceId = options?.workspaceId || activeWorkspaceId;

      // Hủy các query fetch categories đang chạy
      await queryClient.cancelQueries({ queryKey: ['categories', finalWorkspaceId] });

      // Chụp snapshot cache cũ
      const previousCategories = queryClient.getQueryData<CategoryUi[]>(['categories', finalWorkspaceId]);

      if (isUpdate && categoryId) {
        // Cập nhật lạc quan phần tử cũ
        queryClient.setQueryData<CategoryUi[]>(['categories', finalWorkspaceId], (old) => {
          if (!old) return [];
          return old.map((cat) => (cat.id === categoryId ? { ...cat, ...payload } : cat));
        });
      } else {
        // Thêm lạc quan phần tử mới giả lập
        const optimisticCategory: CategoryUi = {
          id: `temp-cat-${Date.now()}`,
          name: payload.name as string,
          icon: payload.icon as string,
          type: payload.type as CategoryType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<CategoryUi[]>(['categories', finalWorkspaceId], (old) => {
          return old ? [...old, optimisticCategory] : [optimisticCategory];
        });
      }

      return { previousCategories, finalWorkspaceId };
    },
    onSuccess: (data, variables) => {
      const isUpdate = variables.options?.isUpdate;
      toast.success(isUpdate ? 'Đã cập nhật danh mục thành công' : 'Đã tạo danh mục thành công');
      variables.options?.onSuccess?.();
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', context.finalWorkspaceId], context.previousCategories);
      }
      const message = error.message || 'Không thể lưu danh mục';
      toast.error(message);
      variables.options?.onError?.(error);
    },
    onSettled: (data, error, variables, context) => {
      const finalWorkspaceId = context?.finalWorkspaceId || variables.options?.workspaceId || activeWorkspaceId;
      queryClient.invalidateQueries({
        queryKey: ['categories', finalWorkspaceId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Xóa thất bại');
      }
      return true;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['categories', activeWorkspaceId] });
      const previousCategories = queryClient.getQueryData<CategoryUi[]>(['categories', activeWorkspaceId]);

      // Xóa lạc quan danh mục khỏi cache
      queryClient.setQueryData<CategoryUi[]>(['categories', activeWorkspaceId], (old) => {
        if (!old) return [];
        return old.filter((cat) => cat.id !== id);
      });

      return { previousCategories };
    },
    onError: (err: Error, id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories', activeWorkspaceId], context.previousCategories);
      }
      toast.error(err.message || 'Không thể xóa danh mục');
    },
    onSuccess: () => {
      toast.success('Đã xóa danh mục thành công');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['categories', activeWorkspaceId],
      });
    },
  });

  const saveCategory = async (
    payload: Record<string, unknown>,
    options?: {
      categoryId?: string;
      isUpdate?: boolean;
      workspaceId?: string;
      onSuccess?: () => void;
      onError?: (err: Error) => void;
    }
  ) => {
    try {
      await mutation.mutateAsync({ payload, options });
      return true;
    } catch {
      return false;
    }
  };

  const deleteCategory = async (id: string, options?: { onSuccess?: () => void }) => {
    try {
      await deleteMutation.mutateAsync(id);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  return {
    isSubmitting: mutation.isPending || deleteMutation.isPending,
    saveCategory,
    deleteCategory,
  };
}




/**
 * Hook quản lý toàn bộ state và logic submit của form danh mục
 * Sử dụng React Hook Form + Zod validation
 */
export function useCategoryForm(options: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  initialData?: {
    name: string;
    type: CategoryType;
    icon: string;
  };
  workspaceId?: string;
  onSuccess?: () => void;
}) {
  const { open, onOpenChange, categoryId, initialData, workspaceId, onSuccess } = options;
  const isUpdate = !!categoryId;
  const { isSubmitting, saveCategory } = useCategoryMutation();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? { name: initialData.name, type: initialData.type, icon: initialData.icon }
      : categoryDefaultValues,
  });

  // Reset form khi dialog mở hoặc initialData thay đổi
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);

    if (open) {
      form.reset(
        initialData
          ? { name: initialData.name, type: initialData.type, icon: initialData.icon }
          : categoryDefaultValues,
      );
    }
  }

  const handleSubmit = async () => {
    // Trigger validation trước
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();

    const payload = {
      name: data.name.trim(),
      icon: data.icon,
      type: data.type,
    };

    await saveCategory(payload, {
      categoryId,
      isUpdate,
      workspaceId,
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  // Giữ backward compatibility: expose các setter/getter quen thuộc
  // eslint-disable-next-line react-hooks/incompatible-library
  const draftName = form.watch('name');
  const draftType = form.watch('type');
  const draftIcon = form.watch('icon');

  return {
    form,
    draftName, setDraftName: (v: string) => form.setValue('name', v),
    draftType, setDraftType: (v: CategoryType) => form.setValue('type', v),
    draftIcon, setDraftIcon: (v: string) => form.setValue('icon', v),
    isSubmitting,
    isUpdate,
    handleSubmit,
  };
}

