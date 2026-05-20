'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTransactionMutation, useTransactions } from '@/hooks/use-transactions';
import { useConfirm } from '@/hooks/use-confirm';
import type { TransactionType, TransactionWithCategory } from '@/types/database';
import { normalizeText, typeLabel } from '../transaction-ui';

export type FilterType = 'all' | TransactionType;
export type SortOption = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export function useTransactionsPage() {
  const { transactions, isLoading, fetchTransactions, month, setMonth } = useTransactions();
  const { deleteTransaction } = useTransactionMutation();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [createOpen, setCreateOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCategory | null>(null);

  // Tham chiếu và toạ độ cho nút FAB có thể kéo thả (Draggable FAB)
  const fabRef = useRef<HTMLButtonElement>(null);
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hasMoved: false, // Nhận diện click vs drag để tránh mở popup khi vừa kéo xong
  });

  // Bắt đầu hành động kéo (hỗ trợ cả chạm và click chuột)
  const handleDragStart = (clientX: number, clientY: number) => {
    dragInfo.current.isDragging = true;
    dragInfo.current.hasMoved = false;
    dragInfo.current.startX = clientX - dragInfo.current.currentX;
    dragInfo.current.startY = clientY - dragInfo.current.currentY;
  };

  // Đang di chuyển nút FAB
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragInfo.current.isDragging) return;

    const dx = clientX - dragInfo.current.startX;
    const dy = clientY - dragInfo.current.startY;

    // Nếu di chuyển vượt quá 5px, coi là kéo và không kích hoạt click
    if (Math.abs(dx - dragInfo.current.currentX) > 5 || Math.abs(dy - dragInfo.current.currentY) > 5) {
      dragInfo.current.hasMoved = true;
    }

    // Giới hạn nút FAB trong Viewport
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 500;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const minX = -screenWidth + 80;
    const maxX = 16;
    const minY = -screenHeight + 180;
    const maxY = 80;

    const boundedX = Math.max(minX, Math.min(maxX, dx));
    const boundedY = Math.max(minY, Math.min(maxY, dy));

    dragInfo.current.currentX = boundedX;
    dragInfo.current.currentY = boundedY;

    if (fabRef.current) {
      // Cập nhật transform trực tiếp tránh re-render liên tục gây giật lag
      fabRef.current.style.transform = `translate(${boundedX}px, ${boundedY}px)`;
    }
  };

  // Kết thúc kéo thả
  const handleDragEnd = () => {
    dragInfo.current.isDragging = false;
  };

  // Đăng ký event di chuyển chuột/chạm toàn màn hình
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onMouseUp = () => handleDragEnd();
    const onTouchEnd = () => handleDragEnd();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // Lọc và sắp xếp dữ liệu
  const filtered = useMemo(() => {
    const q = normalizeText(query);

    let list = transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (!q) return true;
      const hay = normalizeText(
        `${t.category?.name ?? ''} ${t.note ?? ''} ${typeLabel(t.type)}`
      );
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sort === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });

    return list;
  }, [transactions, query, typeFilter, sort]);

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xóa giao dịch',
      message: 'Bạn có chắc chắn muốn xóa giao dịch này không? Số dư tài khoản liên kết sẽ tự động được hoàn lại.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteTransaction(id, { onSuccess: fetchTransactions });
  };

  return {
    transactions,
    isLoading,
    fetchTransactions,
    month,
    setMonth,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    sort,
    setSort,
    createOpen,
    setCreateOpen,
    updateOpen,
    setUpdateOpen,
    selectedTransaction,
    setSelectedTransaction,
    fabRef,
    dragInfo,
    handleDragStart,
    filtered,
    handleDelete,
  };
}
