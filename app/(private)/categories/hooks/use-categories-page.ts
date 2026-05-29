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
  const [applyDefaultsOpen, setApplyDefaultsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    
    setDeletingId(id);
    try {
      await deleteCategory(id);
      await fetchCategories();
    } finally {
      setDeletingId(null);
    }
  };

  // Mở dialog áp dụng danh mục mặc định
  const handleApplyDefaults = () => {
    setApplyDefaultsOpen(true);
  };

  // Lọc và sắp xếp danh mục (Luôn luôn đưa Chi tiêu lên trước, Thu nhập sau)
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    const result = categories.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!q) return true;
      const hay = normalizeText(`${c.name} ${c.icon} ${typeLabel(c.type)}`);
      return hay.includes(q);
    });

    // Sắp xếp: expense lên trước, tiếp đến là income. Trong cùng loại thì sắp xếp theo tên (A-Z)
    return result.sort((a, b) => {
      if (a.type === 'expense' && b.type === 'income') return -1;
      if (a.type === 'income' && b.type === 'expense') return 1;
      return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    });
  }, [query, typeFilter, categories]);

  return {
    categories,
    isLoading, // Trả về trạng thái tải để hiển thị Skeleton
    deletingId,
    applyDefaultsOpen,
    setApplyDefaultsOpen,
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
    handleApplyDefaults,
  };
}

