import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { useWorkspaceStore } from './use-workspace';
import { CategoryType, CategoryUi } from '@/types/category';

/**
 * Hook chuyên xử lý việc lấy danh sách danh mục (GET)
 */
export function useCategories() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [categories, setCategories] = useState<CategoryUi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!activeWorkspaceId) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/categories?workspace_id=${activeWorkspaceId}`);
      if (res.ok) {
        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (json.data || []).map((c: any) => ({
          ...c,
          colorHint: 'slate', // Fallback cho UI
        }));
        setCategories(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    fetchCategories,
  };
}

/**
 * Hook chuyên xử lý việc thêm/sửa danh mục (POST/PATCH)
 */
export function useCategoryMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const { categoryId, isUpdate, workspaceId, onSuccess, onError } = options || {};

    const finalWorkspaceId = workspaceId || activeWorkspaceId;

    if (!isUpdate && !finalWorkspaceId) {
      toast.error('Lỗi hệ thống: Không xác định được workspace đang hoạt động.');
      return false;
    }

    setIsSubmitting(true);
    try {
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

      toast.success(isUpdate ? 'Đã cập nhật danh mục thành công' : 'Đã tạo danh mục thành công');
      onSuccess?.();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lưu danh mục';
      toast.error(message);
      onError?.(error instanceof Error ? error : new Error(message));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    saveCategory,
  };
}

export const DEFAULT_CATEGORY_COLOR = '#64748b';

export function isValidHex6(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/**
 * Hook quản lý toàn bộ state và logic submit của form danh mục
 */
export function useCategoryForm(options: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  initialData?: {
    name: string;
    type: CategoryType; // Type will be inferred correctly where used
    icon: string;
    color: string;
  };
  workspaceId?: string;
  onSuccess?: () => void;
}) {
  const { open, onOpenChange, categoryId, initialData, workspaceId, onSuccess } = options;
  const isUpdate = !!categoryId;
  const { isSubmitting, saveCategory } = useCategoryMutation();

  const [draftName, setDraftName] = useState(initialData?.name || '');
  const [draftType, setDraftType] = useState<CategoryType>(initialData?.type || 'expense');
  const [draftIcon, setDraftIcon] = useState<string>(initialData?.icon || 'Tag');
  const [draftColor, setDraftColor] = useState(initialData?.color || DEFAULT_CATEGORY_COLOR);

  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);

    if (open) {
      setDraftName(initialData?.name || '');
      setDraftType(initialData?.type || 'expense');
      setDraftIcon(initialData?.icon || 'Tag');
      setDraftColor(initialData?.color || DEFAULT_CATEGORY_COLOR);
    }
  }

  const handleSubmit = async () => {
    if (!draftName.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    const payload = {
      name: draftName.trim(),
      icon: draftIcon,
      color: isValidHex6(draftColor) ? draftColor : DEFAULT_CATEGORY_COLOR,
      type: draftType,
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

  return {
    draftName, setDraftName,
    draftType, setDraftType,
    draftIcon, setDraftIcon,
    draftColor, setDraftColor,
    isSubmitting,
    isUpdate,
    handleSubmit,
  };
}
