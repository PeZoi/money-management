'use client';

import { useAccountDetail, useAccountTransactions } from '@/hooks/use-account-detail';
import { useConfirm } from '@/hooks/use-confirm';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import type { TransactionWithCategory } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// Helper sinh các ngày trong tháng
function getDaysInMonth(year: number, monthZeroIndexed: number, limitToToday: boolean): Date[] {
  const date = new Date(year, monthZeroIndexed, 1);
  const days: Date[] = [];
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === monthZeroIndexed;

  while (date.getMonth() === monthZeroIndexed) {
    if (limitToToday && isCurrentMonth && date.getDate() > today.getDate()) {
      break;
    }
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Helper sinh các tháng trong năm
function getMonthsInYear(year: number, limitToToday: boolean): Date[] {
  const months: Date[] = [];
  const today = new Date();
  const limit = (limitToToday && today.getFullYear() === year) ? today.getMonth() : 11;
  for (let m = 0; m <= limit; m++) {
    months.push(new Date(year, m, 1));
  }
  return months;
}

export function useAccountDetailPage(id: string) {
  const router = useRouter();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const { activeWorkspaceId } = useWorkspaceStore();

  // State bộ lọc thời gian
  const [filterType, setFilterType] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'analysis' | 'details'>('analysis');
  const [editOpen, setEditOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Khởi tạo tháng và năm hiện tại
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [year, setYear] = useState<number>(() => new Date().getFullYear());

  // Dialog hiển thị giao dịch của ngày / tháng được chọn
  const [selectedBucket, setSelectedBucket] = useState<{
    label: string;
    transactions: TransactionWithCategory[];
  } | null>(null);

  // Quản lý Dialog Update giao dịch khi click từ danh sách
  const [selectedTx, setSelectedTx] = useState<TransactionWithCategory | null>(null);
  const [updateTxOpen, setUpdateTxOpen] = useState(false);

  // Mutation cho transaction
  const { deleteTransaction } = useTransactionMutation();

  // Xác định ngày bắt đầu lấy dữ liệu (để tính ngược số dư lũy kế từ số dư hiện tại)
  const startDateStr = useMemo(() => {
    if (filterType === 'month') {
      const [y, m] = month.split('-').map(Number);
      return new Date(y, m - 1, 1, 0, 0, 0, 0).toISOString();
    } else {
      return new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
    }
  }, [filterType, month, year]);

  // APIs lấy dữ liệu
  const { account, isLoading: isAccountLoading, refetchAccount } = useAccountDetail(id);
  const { transactions, isLoading: isTxLoading, refetchTransactions } = useAccountTransactions({
    accountId: id,
    startDate: startDateStr,
  });

  const refetchAll = () => {
    refetchAccount();
    refetchTransactions();
    queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
  };

  // Tính toán số dư lũy kế & dữ liệu biểu đồ
  const stats = useMemo(() => {
    if (!account) return { items: [], chartData: [], totalIncome: 0, totalExpense: 0, initialBalance: 0 };

    const balanceNow = Number(account.balance);
    const idLower = id.toLowerCase();

    // 1. Tính tổng thu và chi phát sinh từ startDateStr đến thời điểm hiện tại (now)
    let totalIncomeSinceStart = 0;
    let totalExpenseSinceStart = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      const isSource = t.account_id?.toLowerCase() === idLower;
      const isDest = t.to_account_id?.toLowerCase() === idLower;

      if (t.type === 'income' && isSource) {
        totalIncomeSinceStart += amount;
      } else if (t.type === 'expense' && isSource) {
        totalExpenseSinceStart += amount;
      } else if (t.type === 'transfer') {
        if (isSource) totalExpenseSinceStart += amount; // chuyển đi từ tài khoản này là chi
        if (isDest) totalIncomeSinceStart += amount;    // chuyển đến tài khoản này là thu
      }
    });

    // 2. Tính số dư đầu kì tại thời điểm startDateStr
    const initialBalance = balanceNow - totalIncomeSinceStart + totalExpenseSinceStart;

    // 3. Tạo danh sách các khoảng chia thời gian (Ngày hoặc Tháng)
    let timeBuckets: {
      label: string;
      key: string;
      startDate: Date;
      endDate: Date;
    }[] = [];

    if (filterType === 'month') {
      const [y, m] = month.split('-').map(Number);
      const days = getDaysInMonth(y, m - 1, true); // Giới hạn đến ngày hiện tại
      timeBuckets = days.map((day) => {
        const dStr = String(day.getDate()).padStart(2, '0');
        const mStr = String(day.getMonth() + 1).padStart(2, '0');
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
        return {
          label: `${dStr}/${mStr}`,
          key: `${day.getFullYear()}-${mStr}-${dStr}`,
          startDate: start,
          endDate: end,
        };
      });
    } else {
      const months = getMonthsInYear(year, true); // Giới hạn đến tháng hiện tại
      timeBuckets = months.map((mDate) => {
        const mStr = String(mDate.getMonth() + 1).padStart(2, '0');
        const start = new Date(year, mDate.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(year, mDate.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          label: `Tháng ${mStr}`,
          key: `${year}-${mStr}`,
          startDate: start,
          endDate: end,
        };
      });
    }

    // 4. Phân bổ các giao dịch vào các buckets & tính số dư lũy kế lịch sử
    let runningBalance = initialBalance;
    let sumIncomePeriod = 0;
    let sumExpensePeriod = 0;

    const accountCreatedAt = new Date(account.created_at);
    const createdDateOnly = new Date(
      accountCreatedAt.getFullYear(),
      accountCreatedAt.getMonth(),
      accountCreatedAt.getDate(),
      0, 0, 0, 0
    );

    const items = timeBuckets.map((bucket) => {
      const bucketTransactions = transactions.filter((t) => {
        const tDate = new Date(t.created_at);
        return tDate >= bucket.startDate && tDate <= bucket.endDate;
      });

      let bucketIncome = 0;
      let bucketExpense = 0;

      bucketTransactions.forEach((t) => {
        const amount = Number(t.amount);
        const isSource = t.account_id?.toLowerCase() === idLower;
        const isDest = t.to_account_id?.toLowerCase() === idLower;

        if (t.type === 'income' && isSource) {
          bucketIncome += amount;
        } else if (t.type === 'expense' && isSource) {
          bucketExpense += amount;
        } else if (t.type === 'transfer') {
          if (isSource) bucketExpense += amount;
          if (isDest) bucketIncome += amount;
        }
      });

      runningBalance = runningBalance + bucketIncome - bucketExpense;

      // Xác định xem ngày kết thúc của bucket hiện tại có trước ngày tạo tài khoản không
      const bucketEndDateOnly = new Date(
        bucket.endDate.getFullYear(),
        bucket.endDate.getMonth(),
        bucket.endDate.getDate(),
        0, 0, 0, 0
      );
      const isBeforeCreation = bucketEndDateOnly < createdDateOnly;

      const actualIncome = isBeforeCreation ? 0 : bucketIncome;
      const actualExpense = isBeforeCreation ? 0 : bucketExpense;

      sumIncomePeriod += actualIncome;
      sumExpensePeriod += actualExpense;

      return {
        label: bucket.label,
        key: bucket.key,
        income: actualIncome,
        expense: actualExpense,
        balance: isBeforeCreation ? 0 : runningBalance,
        transactions: isBeforeCreation ? [] : bucketTransactions,
      };
    });

    const chartData = items.map(item => ({
      time: item.label,
      income: item.income,
      expense: item.expense,
      transactions: item.transactions,
    }));

    return {
      items,
      chartData,
      totalIncome: sumIncomePeriod,
      totalExpense: sumExpensePeriod,
      initialBalance,
    };
  }, [account, transactions, filterType, month, year, id]);

  // Lọc transactions của tài khoản chỉ nằm trong chu kỳ được lọc để hiển thị ở Tab Chi tiết
  const filteredPeriodTransactions = useMemo(() => {
    if (filterType === 'month') {
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      return transactions.filter(t => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
      });
    } else {
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return transactions.filter(t => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
      });
    }
  }, [transactions, filterType, month, year]);

  // Thống kê chi tiêu theo danh mục để vẽ biểu đồ tròn (Pie Chart)
  const categoryStats = useMemo(() => {
    const idLower = id.toLowerCase();
    const expenseTransactions = filteredPeriodTransactions.filter(t => {
      // 1. Chi tiêu từ tài khoản này
      if (t.type === 'expense' && t.account_id?.toLowerCase() === idLower) {
        return true;
      }
      // 2. Chuyển khoản đi từ tài khoản này (cũng coi là giảm/chi tiêu đối với tài khoản này)
      if (t.type === 'transfer' && t.account_id?.toLowerCase() === idLower) {
        return true;
      }
      return false;
    });
    const totalExp = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    const map = new Map<string, { name: string; icon: string; amount: number; color: string }>();

    expenseTransactions.forEach((t) => {
      const catId = t.category_id || 'other';
      const catName = t.category?.name || 'Khác';
      const catIcon = t.category?.icon || '🏷️';
      const amount = Number(t.amount);

      const existing = map.get(catId);
      if (existing) {
        existing.amount += amount;
      } else {
        map.set(catId, {
          name: catName,
          icon: catIcon,
          amount: amount,
          color: '', // Sẽ gán màu sau
        });
      }
    });

    const PRESET_PIE_COLORS = [
      '#6366f1', // indigo
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ec4899', // pink
      '#ef4444', // red
      '#06b6d4', // cyan
      '#8b5cf6', // violet
      '#3b82f6', // blue
      '#84cc16', // lime
      '#64748b', // slate
    ];

    const data = Array.from(map.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([catId, value], index) => ({
        id: catId,
        ...value,
        color: PRESET_PIE_COLORS[index % PRESET_PIE_COLORS.length],
        percentage: totalExp > 0 ? Math.round((value.amount / totalExp) * 100) : 0,
      }));

    return {
      data,
      totalExpense: totalExp,
    };
  }, [filteredPeriodTransactions, id]);

  // Sắp xếp danh sách lũy kế theo chiều thời gian được chọn
  const sortedStatsItems = useMemo(() => {
    const itemsCopy = [...stats.items];
    if (sortDirection === 'desc') {
      itemsCopy.reverse();
    }
    return itemsCopy;
  }, [stats.items, sortDirection]);

  // Xử lý xóa giao dịch
  const handleDeleteTx = async (txId: string) => {
    const confirmed = await confirm({
      title: 'Xóa giao dịch',
      message: 'Bạn có chắc chắn muốn xóa giao dịch này? Số dư tài khoản sẽ tự động được cập nhật lại.',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteTransaction(txId, { onSuccess: refetchAll });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return {
    router,
    account,
    isAccountLoading,
    isTxLoading,
    filterType,
    setFilterType,
    activeTab,
    setActiveTab,
    editOpen,
    setEditOpen,
    sortDirection,
    setSortDirection,
    month,
    setMonth,
    year,
    setYear,
    years,
    selectedBucket,
    setSelectedBucket,
    selectedTx,
    setSelectedTx,
    updateTxOpen,
    setUpdateTxOpen,
    stats,
    filteredPeriodTransactions,
    categoryStats,
    sortedStatsItems,
    handleDeleteTx,
    refetchAll,
  };
}
