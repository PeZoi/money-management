'use client';

import { useMemo, useState } from 'react';
import { useCategories } from '@/hooks/use-categories';
import type { CategoryType, CategoryUi } from '@/types/category';
import { normalizeText, typeLabel } from '../category-ui';

export function useCategoriesPage() {
  const { categories, isLoading, fetchCategories } = useCategories();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryUi | null>(null);

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
  };
}

