'use client';

import { useCategories, useCategoryMutation } from '@/hooks/use-categories';
import { useConfirm } from '@/hooks/use-confirm';
import type { CategoryType, CategoryUi } from '@/types/category';
import { useMemo, useState } from 'react';
import { normalizeText, typeLabel } from '../category-ui';

export function useCategoriesPage() {
  const { categories, isLoading, fetchCategories } = useCategories();
  const { deleteCategory } = useCategoryMutation();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryUi | null>(null);

  // Xử lý xóa danh mục
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xóa danh mục',
      message: 'Bạn có chắc chắn muốn xóa danh mục này? Các giao dịch liên kết với danh mục này sẽ chuyển sang danh mục mặc định.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteCategory(id, { onSuccess: fetchCategories });
  };

  // Lọc danh mục theo tìm kiếm (tên, icon) và phân loại thu/chi
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return categories.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!q) return true;
      const hay = normalizeText(`${c.name} ${c.icon} ${typeLabel(c.type)}`);
      return hay.includes(q);
    });
  }, [query, typeFilter, categories]);

  return {
    categories,
    isLoading, // Trả về trạng thái tải để hiển thị Skeleton
    fetchCategories,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    createOpen,
    setCreateOpen,
    editingCategory,
    setEditingCategory,
    filtered,
    handleDelete,
  };
}

