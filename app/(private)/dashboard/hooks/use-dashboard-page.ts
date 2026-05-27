'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths, 
  addYears, 
  subYears,
  format,
  isSameDay,
  addDays
} from 'date-fns';
import { useAccounts, useAccountMutation } from '@/hooks/use-accounts';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useDraggable } from '@/hooks/use-draggable';
import type { TransactionWithCategory } from '@/types/database';

// Helper tính toán năm hiện hành, tháng hiện hành của chu kỳ trước đó
const getPreviousPeriodDates = (
  range: 'week' | 'month' | 'year' | 'all',
  refDate: Date
) => {
  if (range === 'week') {
    const prevDate = subWeeks(refDate, 1);
    return {
      start: startOfWeek(prevDate, { weekStartsOn: 1 }),
      end: endOfWeek(prevDate, { weekStartsOn: 1 }),
    };
  }
  if (range === 'month') {
    const prevDate = subMonths(refDate, 1);
    return {
      start: startOfMonth(prevDate),
      end: endOfMonth(prevDate),
    };
  }
  if (range === 'year') {
    const prevDate = subYears(refDate, 1);
    return {
      start: startOfYear(prevDate),
      end: endOfYear(prevDate),
    };
  }
  return { start: null, end: null };
};

export function useDashboardPage() {
  const queryClient = useQueryClient();
  const { activeWorkspaceId } = useWorkspaceStore();
  const { data: workspaces = [] } = useWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Tránh Hydration Mismatch bằng cách chỉ render client sau khi đã mount
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 1. Quản lý các State cho bộ lọc thời gian
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'year' | 'all'>('month');
  const [referenceDate, setReferenceDate] = React.useState<Date>(() => new Date());

  // 2. State cho các hộp thoại CRUD
  const [createOpen, setCreateOpen] = React.useState(false);
  const [updateOpen, setUpdateOpen] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<TransactionWithCategory | null>(null);
  const [selectedBucket, setSelectedBucket] = React.useState<{
    label: string;
    transactions: TransactionWithCategory[];
  } | null>(null);

  const [activatingId, setActivatingId] = React.useState<string | null>(null);

  // 3. Setup Draggable FAB
  const { ref: fabRef, dragInfo, handleDragStart } = useDraggable();

  // 4. Tính toán khoảng thời gian hiện tại
  const currentPeriod = React.useMemo(() => {
    if (timeRange === 'week') {
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      };
    }
    if (timeRange === 'month') {
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
    }
    if (timeRange === 'year') {
      return {
        start: startOfYear(referenceDate),
        end: endOfYear(referenceDate),
      };
    }
    return { start: null, end: null };
  }, [timeRange, referenceDate]);

  // 5. Tính toán khoảng thời gian chu kỳ trước
  const previousPeriod = React.useMemo(() => {
    return getPreviousPeriodDates(timeRange, referenceDate);
  }, [timeRange, referenceDate]);

  // 6. Fetch dữ liệu tài khoản và mutation active
  const { accounts = [], isLoading: isAccountsLoading } = useAccounts();
  const { activateAccount } = useAccountMutation();

  // 7. Query fetch giao dịch chu kỳ hiện tại
  const { data: currentTransactions = [], isLoading: isCurrentLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ['transactions-report', activeWorkspaceId, timeRange, currentPeriod.start?.toISOString(), currentPeriod.end?.toISOString()],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      let url = `/api/transactions?workspace_id=${activeWorkspaceId}`;
      if (timeRange !== 'all' && currentPeriod.start && currentPeriod.end) {
        url += `&start_date=${currentPeriod.start.toISOString()}&end_date=${currentPeriod.end.toISOString()}`;
      } else {
        url += `&month=all`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải giao dịch hiện tại');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId,
  });

  // 8. Query fetch giao dịch chu kỳ trước
  const { data: prevTransactions = [], isLoading: isPrevLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ['transactions-report-prev', activeWorkspaceId, timeRange, previousPeriod.start?.toISOString(), previousPeriod.end?.toISOString()],
    queryFn: async () => {
      if (!activeWorkspaceId || timeRange === 'all' || !previousPeriod.start || !previousPeriod.end) return [];
      const url = `/api/transactions?workspace_id=${activeWorkspaceId}&start_date=${previousPeriod.start.toISOString()}&end_date=${previousPeriod.end.toISOString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải giao dịch chu kỳ trước');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId && timeRange !== 'all' && !!previousPeriod.start && !!previousPeriod.end,
  });

  // 8.5. Query fetch giao dịch ngày hôm nay độc lập với filter thời gian
  const { data: todayTransactionsRaw = [], isLoading: isTodayLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ['transactions-today', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      const url = `/api/transactions?workspace_id=${activeWorkspaceId}&start_date=${start.toISOString()}&end_date=${end.toISOString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Không thể tải giao dịch hôm nay');
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId,
  });

  // Callback làm mới dữ liệu sau CRUD
  const handleMutationSuccess = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions-report', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions-report-prev', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions-today', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: ['accounts', activeWorkspaceId] });
  }, [queryClient, activeWorkspaceId]);

  // Hành động xóa giao dịch
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Xóa thất bại');
      }
      handleMutationSuccess();
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // 9. Tính toán các chỉ số tài chính của chu kỳ hiện tại
  const stats = React.useMemo(() => {
    const safeAccounts = accounts || [];
    const safeCurrentTx = currentTransactions || [];
    const safePrevTx = prevTransactions || [];

    // Available Balance (tổng tiền mặt/ngân hàng khả dụng)
    const availableBalance = safeAccounts.reduce((sum, a) => sum + (a ? Number(a.balance || 0) : 0), 0);

    // Thu nhập hiện tại
    const currentIncome = safeCurrentTx
      .filter((t) => t && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Chi tiêu hiện tại
    const currentExpense = safeCurrentTx
      .filter((t) => t && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Dòng tiền ròng
    const currentNet = currentIncome - currentExpense;

    // Thu nhập trước đó
    const prevIncome = safePrevTx
      .filter((t) => t && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Chi tiêu trước đó
    const prevExpense = safePrevTx
      .filter((t) => t && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Tính toán tỷ lệ % biến động
    const incomeDiff = currentIncome - prevIncome;
    const incomePercent = prevIncome > 0 
      ? (incomeDiff / prevIncome) * 100 
      : (currentIncome > 0 ? 100 : 0);

    const expenseDiff = currentExpense - prevExpense;
    const expensePercent = prevExpense > 0 
      ? (expenseDiff / prevExpense) * 100 
      : (currentExpense > 0 ? 100 : 0);

    return {
      availableBalance,
      currentIncome,
      currentExpense,
      currentNet,
      incomePercent,
      expensePercent,
    };
  }, [accounts, currentTransactions, prevTransactions]);

  // 10. Gom nhóm dữ liệu biểu đồ Area
  const trendData = React.useMemo(() => {
    const safeCurrentTx = currentTransactions || [];
    
    if (timeRange === 'week' && currentPeriod.start) {
      const days = [];
      const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
      for (let i = 0; i < 7; i++) {
        const d = addDays(currentPeriod.start, i);
        const dayTransactions = safeCurrentTx.filter((t) => {
          if (!t || !t.created_at) return false;
          const tDate = new Date(t.created_at);
          return !isNaN(tDate.getTime()) && isSameDay(tDate, d);
        });
        const income = dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        days.push({
          time: dayNames[i],
          income,
          expense,
          transactions: dayTransactions,
        });
      }
      return days;
    }

    if (timeRange === 'month' && currentPeriod.start && currentPeriod.end) {
      const numDays = currentPeriod.end.getDate();
      const days = [];
      for (let i = 1; i <= numDays; i++) {
        const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), i);
        const dayTransactions = safeCurrentTx.filter((t) => {
          if (!t || !t.created_at) return false;
          const tDate = new Date(t.created_at);
          return !isNaN(tDate.getTime()) && isSameDay(tDate, d);
        });
        const income = dayTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = dayTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        days.push({
          time: String(i).padStart(2, '0'),
          income,
          expense,
          transactions: dayTransactions,
        });
      }
      return days;
    }

    if (timeRange === 'year') {
      const months = [];
      const monthNames = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
      for (let i = 0; i < 12; i++) {
        const monthTransactions = safeCurrentTx.filter((t) => {
          if (!t || !t.created_at) return false;
          const d = new Date(t.created_at);
          return !isNaN(d.getTime()) && d.getFullYear() === referenceDate.getFullYear() && d.getMonth() === i;
        });
        const income = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
        months.push({
          time: monthNames[i],
          income,
          expense,
          transactions: monthTransactions,
        });
      }
      return months;
    }

    // Chế độ 'all' (lịch sử)
    const monthMap: Record<string, { income: number; expense: number; transactions: TransactionWithCategory[] }> = {};
    safeCurrentTx.forEach((t) => {
      if (!t || !t.created_at) return;
      const d = new Date(t.created_at);
      if (isNaN(d.getTime())) return;
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const amount = Number(t.amount || 0);
      if (!monthMap[key]) {
        monthMap[key] = { income: 0, expense: 0, transactions: [] };
      }
      if (t.type === 'income') monthMap[key].income += amount;
      if (t.type === 'expense') monthMap[key].expense += amount;
      monthMap[key].transactions.push(t);
    });

    const sortedMonths = Object.keys(monthMap)
      .map((key) => {
        const [m, y] = key.split('/').map(Number);
        return { key, sortVal: y * 12 + m };
      })
      .sort((a, b) => a.sortVal - b.sortVal)
      .slice(-6); // hiển thị tối đa 6 tháng phát sinh gần nhất

    return sortedMonths.map((item) => ({
      time: item.key,
      income: monthMap[item.key].income,
      expense: monthMap[item.key].expense,
      transactions: monthMap[item.key].transactions,
    }));
  }, [currentTransactions, timeRange, referenceDate, currentPeriod]);

  // 11. Chuẩn bị dữ liệu so sánh cho Bar Chart
  const comparisonData = React.useMemo(() => {
    let currentLabel = 'Hiện tại';
    let previousLabel = 'Trước đó';

    if (timeRange === 'week') {
      currentLabel = 'Tuần này';
      previousLabel = 'Tuần trước';
    } else if (timeRange === 'month') {
      currentLabel = 'Tháng này';
      previousLabel = 'Tháng trước';
    } else if (timeRange === 'year') {
      currentLabel = 'Năm nay';
      previousLabel = 'Năm ngoái';
    }

    const currentIncome = stats.currentIncome;
    const currentExpense = stats.currentExpense;

    const safePrevTx = prevTransactions || [];
    const previousIncome = safePrevTx
      .filter((t) => t && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const previousExpense = safePrevTx
      .filter((t) => t && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      current: { label: currentLabel, income: currentIncome, expense: currentExpense },
      previous: { label: previousLabel, income: previousIncome, expense: previousExpense },
    };
  }, [timeRange, stats, prevTransactions]);

  // 12. Giao dịch hôm nay độc lập với filter thời gian
  const todayTransactions = todayTransactionsRaw;

  // Điều hướng lùi thời gian
  const handlePrevPeriod = () => {
    if (timeRange === 'week') setReferenceDate((d) => subWeeks(d, 1));
    else if (timeRange === 'month') setReferenceDate((d) => subMonths(d, 1));
    else if (timeRange === 'year') setReferenceDate((d) => subYears(d, 1));
  };

  // Điều hướng tiến thời gian
  const handleNextPeriod = () => {
    if (timeRange === 'week') setReferenceDate((d) => addWeeks(d, 1));
    else if (timeRange === 'month') setReferenceDate((d) => addMonths(d, 1));
    else if (timeRange === 'year') setReferenceDate((d) => addYears(d, 1));
  };

  // Nhanh chóng quay lại ngày hôm nay
  const handleResetToToday = () => {
    setReferenceDate(new Date());
  };

  // Text biểu diễn chu kỳ hiện tại
  const periodLabel = React.useMemo(() => {
    if (timeRange === 'week' && currentPeriod.start && currentPeriod.end) {
      return `Tuần ${format(currentPeriod.start, 'dd/MM')} - ${format(currentPeriod.end, 'dd/MM/yyyy')}`;
    }
    if (timeRange === 'month') {
      return `Tháng ${format(referenceDate, 'MM/yyyy')}`;
    }
    if (timeRange === 'year') {
      return `Năm ${format(referenceDate, 'yyyy')}`;
    }
    return 'Tất cả thời gian';
  }, [timeRange, referenceDate, currentPeriod]);

  const isReportLoading = isCurrentLoading || isPrevLoading || isAccountsLoading || isTodayLoading;

  return {
    mounted,
    timeRange,
    setTimeRange,
    referenceDate,
    setReferenceDate,
    createOpen,
    setCreateOpen,
    updateOpen,
    setUpdateOpen,
    selectedTransaction,
    setSelectedTransaction,
    selectedBucket,
    setSelectedBucket,
    activatingId,
    setActivatingId,
    fabRef,
    dragInfo,
    handleDragStart,
    accounts,
    stats,
    trendData,
    comparisonData,
    todayTransactions,
    handlePrevPeriod,
    handleNextPeriod,
    handleResetToToday,
    handleDeleteTransaction,
    handleMutationSuccess,
    activateAccount,
    periodLabel,
    isReportLoading,
    currentWorkspace,
    currentTransactions,
    prevTransactions
  };
}
