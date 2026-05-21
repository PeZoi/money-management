import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useWorkspaceStore } from './use-workspace';
import { CategoryType, CategoryUi } from '@/types/category';
import {
  categorySchema,
  categoryDefaultValues,
  type CategoryFormValues,
  DEFAULT_CATEGORY_COLOR,
  isValidHex6,
} from '@/lib/validations/category-schema';


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
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (json.data || []).map((c: any) => ({
        ...c,
        colorHint: 'slate', // Fallback cho UI
      }));
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
    onSuccess: (data, variables) => {
      const isUpdate = variables.options?.isUpdate;
      toast.success(isUpdate ? 'Đã cập nhật danh mục thành công' : 'Đã tạo danh mục thành công');
      
      // Invalidate cache categories
      const finalWorkspaceId = variables.options?.workspaceId || activeWorkspaceId;
      queryClient.invalidateQueries({
        queryKey: ['categories', finalWorkspaceId],
      });

      variables.options?.onSuccess?.();
    },
    onError: (error: Error, variables) => {
      const message = error.message || 'Không thể lưu danh mục';
      toast.error(message);
      variables.options?.onError?.(error);
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

  return {
    isSubmitting: mutation.isPending,
    saveCategory,
  };
}


// Re-export từ schema mới để giữ backward compatibility
export { DEFAULT_CATEGORY_COLOR, isValidHex6 } from '@/lib/validations/category-schema';

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
    color: string;
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
      ? { name: initialData.name, type: initialData.type, icon: initialData.icon, color: initialData.color }
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
          ? { name: initialData.name, type: initialData.type, icon: initialData.icon, color: initialData.color }
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
      color: isValidHex6(data.color) ? data.color : DEFAULT_CATEGORY_COLOR,
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
  const draftColor = form.watch('color');

  return {
    form,
    draftName, setDraftName: (v: string) => form.setValue('name', v),
    draftType, setDraftType: (v: CategoryType) => form.setValue('type', v),
    draftIcon, setDraftIcon: (v: string) => form.setValue('icon', v),
    draftColor, setDraftColor: (v: string) => form.setValue('color', v, { shouldValidate: true }),
    isSubmitting,
    isUpdate,
    handleSubmit,
  };
}

