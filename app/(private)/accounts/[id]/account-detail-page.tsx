'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ArrowUpDownIcon,
  BarChart3Icon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EditIcon,
  HelpCircleIcon,
  HistoryIcon,
  PieChartIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  TrendingUpIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';

import AccountFormDialog from '@/app/(private)/accounts/components/account-form-dialog';
import TransactionsList from '@/app/(private)/transactions/components/transactions-list';
import UpdateTransactionDialog from '@/app/(private)/transactions/components/update-transaction-dialog';
import { useAccountDetail, useAccountTransactions } from '@/hooks/use-account-detail';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { useWorkspaceStore } from '@/hooks/use-workspace';

// Custom components cho trang chi tiết tài khoản
import IconPreview from '@/components/icons/icon-preview';
import DayTransactionsDialog from './day-transactions-dialog';

// Shadcn Chart components
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Component chọn năm đồng bộ visual với MonthPicker
interface YearPickerProps {
  value: number;
  onChange: (year: number) => void;
  years: number[];
}

function YearPicker({ value, onChange, years }: YearPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      {/* Nút lùi 1 năm */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value - 1)}
        className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all"
        title="Năm trước"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      {/* Popover chọn năm */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 px-4 rounded-xl border-muted/50 font-medium text-sm flex items-center gap-2 min-w-[155px] justify-between shadow-xs bg-card/60 backdrop-blur-xs transition-all hover:bg-accent/60 hover:text-accent-foreground"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary/70" />
              <span>Năm {value}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {value === new Date().getFullYear() && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider leading-none">
                  Now
                </span>
              )}
              <ChevronRightIcon className="h-3 w-3 opacity-40 rotate-90" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[180px] p-2 rounded-2xl border shadow-xl bg-popover/95 backdrop-blur-md">
          <div className="flex flex-col gap-1">
            {years.map((y) => {
              const isSelected = value === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onChange(y);
                    setOpen(false);
                  }}
                  className={cn(
                    "h-9 px-3 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-between border border-transparent cursor-pointer",
                    isSelected
                      ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/30 font-bold scale-[1.02]"
                      : "hover:bg-accent hover:border-accent-foreground/10 text-muted-foreground hover:text-foreground active:scale-95"
                  )}
                >
                  <span>Năm {y}</span>
                  {isSelected && <CheckIcon className="size-3.5" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Nút tiến 1 năm */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(value + 1)}
        className="h-10 w-10 rounded-xl border-muted/50 hover:bg-accent/60 hover:text-accent-foreground active:scale-95 transition-all"
        title="Năm sau"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

type AccountDetailPageProps = {
  id: string;
};

// Định nghĩa cấu hình cho biểu đồ Shadcn Chart
const chartConfig = {
  income: {
    label: 'Thu nhập',
    color: '#10b981', // Xanh lá
  },
  expense: {
    label: 'Chi tiêu',
    color: '#f43f5e', // Đỏ
  },
} satisfies ChartConfig;

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

type CustomPieTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: {
      id: string;
      name: string;
      icon: string;
      amount: number;
      percentage: number;
    };
  }>;
};

const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-popover/95 backdrop-blur-md border rounded-xl p-2.5 shadow-lg text-[10px] sm:text-xs font-semibold border-muted/80 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="size-4.5 shrink-0 flex items-center justify-center overflow-hidden text-muted-foreground">
            {data.id !== 'other' ? (
              <IconPreview name={data.icon} className="size-3.5" />
            ) : (
              <HelpCircleIcon className="size-3.5" />
            )}
          </div>
          <span className="text-foreground font-bold">{data.name}</span>
          <span className="text-muted-foreground font-semibold">({data.percentage}%)</span>
        </div>
        <p className="text-primary font-black tabular-nums pl-6">
          {data.amount.toLocaleString('vi-VN')}₫
        </p>
      </div>
    );
  }
  return null;
};

export default function AccountDetailPage({ id }: AccountDetailPageProps) {
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
      const catIcon = t.category?.icon || '';
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

  // Render thẻ tài khoản chi tiết
  const renderCard = () => {
    if (!account) return <Skeleton className="h-44 w-full rounded-2xl" />;

    const balance = Number(account.balance);
    const cardColor = account.color || '#6366f1';

    if (account.type === 'bank' || account.type === 'e_wallet') {
      return (
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between h-44 select-none animate-in fade-in duration-300"
          style={{
            background: `linear-gradient(135deg, ${cardColor} 0%, rgba(15, 23, 42, 0.95) 100%)`,
            boxShadow: `inset 0 1.5px 0 0 rgba(255, 255, 255, 0.2), 0 12px 24px -8px ${cardColor}40`,
          }}
        >
          <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />
          <div className="absolute -right-8 -bottom-8 size-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between gap-1 relative z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black tracking-widest text-white/85 uppercase truncate">
                {account.type === 'bank' ? 'THẺ NGÂN HÀNG' : 'VÍ ĐIỆN TỬ'}
              </span>
              <span className="relative flex size-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
              </span>
            </div>
            
            {/* Chip đồng giả lập */}
            <div className="relative flex h-5 w-7 shrink-0 items-center justify-center rounded-sm bg-linear-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-200/50 shadow-xs">
              <div className="absolute inset-x-0 top-1/2 h-[0.5px] bg-amber-700/30" />
              <div className="absolute inset-y-0 left-1/2 w-[0.5px] bg-amber-700/30" />
              <div className="absolute top-0.5 bottom-0.5 left-1 right-1 border-[0.5px] border-amber-700/20 rounded-xs" />
            </div>
          </div>

          {/* Body */}
          <div className="my-1 relative z-10">
            <span className="text-[9px] text-white/60 font-semibold tracking-wider block">SỐ DƯ KHẢ DỤNG</span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-white tabular-nums truncate">
              {balance < 0 ? '-' : ''}
              {Math.abs(balance).toLocaleString('vi-VN')}₫
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between gap-1 mt-auto relative z-10">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold tracking-wide text-white truncate uppercase">
                {account.name}
              </p>
            </div>
            <span className="text-xl sm:text-2xl shrink-0 drop-shadow-md">
              {account.icon || '💳'}
            </span>
          </div>
        </div>
      );
    }

    // Giao diện Tiền mặt
    return (
      <div
        className="relative overflow-hidden rounded-2xl p-5 border shadow-lg flex flex-col justify-between h-44 select-none animate-in fade-in duration-300 bg-linear-to-br from-emerald-50 via-emerald-100/70 to-teal-50 border-emerald-500/20 text-emerald-950 dark:from-emerald-950/40 dark:to-emerald-900/60 dark:border-emerald-500/10 dark:text-emerald-50"
        style={{
          boxShadow: `0 12px 24px -8px rgba(16,185,129,0.15)`,
        }}
      >
        <div className="absolute inset-1 border border-dashed border-emerald-600/15 dark:border-emerald-400/15 rounded-xl pointer-events-none" />
        <div className="absolute right-2 top-2 text-7xl text-emerald-500/5 dark:text-emerald-400/5 pointer-events-none font-bold select-none">
          💵
        </div>

        <div className="flex flex-col h-full justify-between gap-3 relative z-10">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black tracking-widest text-emerald-700/85 dark:text-emerald-400/85 uppercase truncate">
                TIỀN MẶT
              </span>
              <span className="relative flex size-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-xl sm:text-2xl drop-shadow-xs">💵</span>
          </div>

          <div className="my-1">
            <span className="text-[9px] text-emerald-700/60 dark:text-emerald-400/60 font-semibold tracking-wider block">TIỀN MẶT CÓ SẴN</span>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
              {balance < 0 ? '-' : ''}
              {Math.abs(balance).toLocaleString('vi-VN')}₫
            </p>
          </div>

          <div className="mt-auto">
            <span className="text-[9px] text-emerald-700/40 dark:text-emerald-400/40 block">TÊN VÍ TIỀN</span>
            <p className="text-xs sm:text-sm font-bold tracking-wide truncate uppercase">
              {account.name}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isAccountLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="mb-2 text-lg font-semibold">Không tìm thấy tài khoản</h3>
        <Button variant="outline" className="rounded-xl" onClick={() => router.push('/accounts')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <>
      <PrivatePageShell
        title={account.name}
        description="Báo cáo chi tiết luồng tiền và lịch sử giao dịch phát sinh."
        icon={CreditCardIcon}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/accounts')}
              className="rounded-xl h-10 text-xs font-semibold"
            >
              <ArrowLeftIcon className="mr-1.5 size-4" />
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-xl h-10 text-xs font-semibold"
            >
              <EditIcon className="mr-1.5 size-4" />
              Chỉnh sửa
            </Button>
          </div>
        }
      >
        {/* HÀNG TRÊN CÙNG: Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Thẻ tài khoản - Chiếm full width trên mobile, 1 cột trên desktop */}
          <div className="col-span-2 md:col-span-1">
            {renderCard()}
          </div>

          {/* Tổng Thu */}
          <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-44">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tổng Thu</span>
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs">
                <TrendingUpIcon className="size-4 sm:size-4.5" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-base sm:text-xl font-black text-emerald-700 dark:text-emerald-400 tabular-nums truncate">
                +{stats.totalIncome.toLocaleString('vi-VN')}₫
              </p>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 block">Trong chu kỳ lọc</span>
            </div>
          </div>

          {/* Tổng Chi */}
          <div className="col-span-1 md:col-span-1 relative overflow-hidden rounded-2xl border border-rose-500/10 bg-rose-500/5 dark:bg-rose-500/10 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-36 sm:h-44">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Tổng Chi</span>
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-xs">
                <TrendingDownIcon className="size-4 sm:size-4.5" />
              </div>
            </div>
            <div className="mt-auto">
              <p className="text-base sm:text-xl font-black text-rose-700 dark:text-rose-400 tabular-nums truncate">
                -{stats.totalExpense.toLocaleString('vi-VN')}₫
              </p>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 block">Trong chu kỳ lọc</span>
            </div>
          </div>
        </div>

        {/* KHỐI DƯỚI: Bộ lọc, Tabs và nội dung chi tiết */}
        <div className="mt-6 space-y-6">
          {/* Bộ lọc thời gian */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border bg-card/50 rounded-2xl p-4 shadow-xs">
            <div className="flex p-1 rounded-xl bg-muted/60 border gap-0.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterType('month')}
                className={cn(
                  'flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filterType === 'month' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setFilterType('year')}
                className={cn(
                  'flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filterType === 'year' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Theo năm
              </button>
            </div>

            {/* Picker động */}
            <div className="flex items-center gap-2 justify-center sm:justify-end w-full sm:w-auto">
              {filterType === 'month' ? (
                <MonthPicker value={month} onChange={setMonth} />
              ) : (
                <YearPicker value={year} onChange={setYear} years={years} />
              )}
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex w-full p-1 rounded-2xl bg-muted/60 border border-muted-foreground/10 gap-1 shadow-inner select-none">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95',
                activeTab === 'analysis'
                  ? 'bg-background text-foreground shadow-md border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
              )}
            >
              <BarChart3Icon className="size-4 text-primary" />
              <span className="hidden sm:inline">Phân tích & Biểu đồ</span>
              <span className="inline sm:hidden">Phân tích</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95',
                activeTab === 'details'
                  ? 'bg-background text-foreground shadow-md border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/20'
              )}
            >
              <HistoryIcon className="size-4 text-primary" />
              <span className="hidden sm:inline">Danh sách giao dịch</span>
              <span className="inline sm:hidden">Giao dịch</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'analysis' ? (
            <div className="grid grid-cols-1 gap-6">
              {/* Line Chart */}
              <div className="border bg-card/65 rounded-2xl p-5 shadow-xs animate-in fade-in duration-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 mb-6 flex items-center gap-2">
                  <BarChart3Icon className="size-4 text-primary" />
                  Xu hướng Thu nhập vs Chi tiêu
                </h3>

                {isTxLoading ? (
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-xl" />
                  </div>
                ) : stats.chartData.length === 0 ? (
                  <div className="h-[250px] w-full flex items-center justify-center text-center text-muted-foreground text-sm">
                    Không có dữ liệu trong chu kỳ lọc.
                  </div>
                ) : (
                  <ChartContainer key={`line-${activeTab}`} config={chartConfig} className="h-[250px] w-full">
                    <LineChart data={stats.chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        minTickGap={35}
                        tickFormatter={(value) => value}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => `${(value / 1000).toLocaleString('vi-VN')}k`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="income"
                        stroke="var(--color-income)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        name="expense"
                        stroke="var(--color-expense)"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </div>

              {/* Pie Chart */}
              <div className="border bg-card/65 rounded-2xl p-5 shadow-xs animate-in fade-in duration-300">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 mb-6 flex items-center gap-2">
                  <PieChartIcon className="size-4 text-primary" />
                  Cơ cấu chi tiêu theo danh mục
                </h3>

                {isTxLoading ? (
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-xl" />
                  </div>
                ) : categoryStats.data.length === 0 ? (
                  <div className="h-[250px] w-full flex items-center justify-center text-center text-muted-foreground text-sm">
                    Không có dữ liệu chi tiêu trong chu kỳ lọc.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                    {/* Biểu đồ Donut */}
                    <div className="h-[200px] relative flex items-center justify-center">
                      <ResponsiveContainer key={`pie-${activeTab}`} width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={categoryStats.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="amount"
                          >
                            {categoryStats.data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 100 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Label ở tâm hình Donut */}
                      <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Tổng chi</span>
                        <span className="text-xs sm:text-sm font-extrabold text-foreground mt-0.5 tabular-nums">
                          {categoryStats.totalExpense.toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                    </div>
                    
                    {/* Danh sách chú thích chi tiết đơn giản, sạch sẽ */}
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 w-full">
                      {categoryStats.data.map((item, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            const idLower = id.toLowerCase();
                            const catTransactions = filteredPeriodTransactions.filter(t => {
                              // Chỉ lấy giao dịch chi tiêu (bao gồm expense và transfer đi của tài khoản này)
                              const isExpenseOrTransferOut = 
                                (t.type === 'expense' && t.account_id?.toLowerCase() === idLower) ||
                                (t.type === 'transfer' && t.account_id?.toLowerCase() === idLower);
                              
                              if (!isExpenseOrTransferOut) return false;
                              
                              const tCatId = t.category_id || 'other';
                              return tCatId === item.id;
                            });
                            setSelectedBucket({
                              label: `Giao dịch danh mục: ${item.name}`,
                              transactions: catTransactions,
                            });
                          }}
                          className="flex items-center justify-between gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-muted/30 cursor-pointer active:scale-98 transition-all select-none"
                        >
                          {/* Trái: Icon + Tên danh mục */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Ô Icon bo góc kiểu iOS gọn gàng bảo vệ layout */}
                            <div className="size-7 shrink-0 flex items-center justify-center rounded-lg bg-muted/60 select-none overflow-hidden text-muted-foreground">
                              {item.id !== 'other' ? (
                                <IconPreview name={item.icon} className="size-4" />
                              ) : (
                                <HelpCircleIcon className="size-4" />
                              )}
                            </div>
                            <span className="font-bold text-xs text-foreground/90 truncate">{item.name}</span>
                          </div>
                          {/* Phải: Phần trăm & Số tiền */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-muted-foreground/80 shrink-0 leading-none">{item.percentage}%</span>
                              <div className="h-0.5 w-full rounded-full mt-1" style={{ backgroundColor: item.color }} />
                            </div>
                            <span className="text-xs font-extrabold text-foreground tabular-nums">
                              {item.amount.toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              {filteredPeriodTransactions.length === 0 ? (
                <div className="rounded-2xl border bg-card/40 p-12 text-center shadow-xs">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-muted/40 text-muted-foreground">
                    <ReceiptTextIcon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">Không tìm thấy giao dịch nào</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                    Tài khoản này chưa phát sinh giao dịch nào trong khoảng thời gian được lọc.
                  </p>
                </div>
              ) : (
                <TransactionsList
                  transactions={filteredPeriodTransactions}
                  isLoading={isTxLoading}
                  onRequestCreate={() => {}} // Chỉ xem và quản lý giao dịch có sẵn
                  onRequestDelete={handleDeleteTx}
                  onRequestUpdate={(t) => {
                    setSelectedTx(t);
                    setUpdateTxOpen(true);
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* BẢNG THỐNG KÊ LŨY KẾ SỐ DƯ */}
        <div className="mt-8 border bg-card/65 rounded-2xl p-4 sm:p-5 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90">
                Thống kê số dư lũy kế
              </h3>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Nhấp vào một dòng để xem danh sách giao dịch chi tiết phát sinh trong ngày/tháng đó.
              </p>
            </div>
            <Badge variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary text-xs font-semibold">
              Số dư đầu kỳ: {stats.initialBalance.toLocaleString('vi-VN')}₫
            </Badge>
          </div>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-[11px] sm:text-sm border-collapse min-w-[550px] sm:min-w-0">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground/80 font-bold uppercase text-[9px] sm:text-xs">
                  <th 
                    className="py-2.5 sm:py-3 px-2 sm:px-4 cursor-pointer select-none hover:text-foreground transition-colors group/header"
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Thời gian</span>
                      <ArrowUpDownIcon className="size-3 sm:size-3.5 opacity-60 group-hover/header:opacity-100 transition-opacity" />
                    </div>
                  </th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Thu nhập (+)</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Chi tiêu (-)</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Thu chi ròng</th>
                  <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Số dư lũy kế</th>
                  <th className="py-2.5 sm:py-3 px-1 sm:px-3 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isTxLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4"><Skeleton className="h-4 w-10 sm:w-12" /></td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-14 sm:w-16 ml-auto" /></td>
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right"><Skeleton className="h-4 w-18 sm:w-20 ml-auto" /></td>
                      <td className="py-2.5 sm:py-3 px-1 sm:px-3"><Skeleton className="h-4 w-4 mx-auto" /></td>
                    </tr>
                  ))
                ) : stats.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  sortedStatsItems.map((item) => {
                    const hasTransactions = item.transactions.length > 0;
                    // Tính biến động thu chi ròng của ngày/tháng
                    const netChange = item.income - item.expense;
                    
                    return (
                      <tr
                        key={item.key}
                        onClick={() => {
                          if (hasTransactions) {
                            setSelectedBucket({
                              label: filterType === 'month' ? `Giao dịch ngày ${item.label}/${year}` : `Giao dịch tháng ${item.label}/${year}`,
                              transactions: item.transactions,
                            });
                          }
                        }}
                        className={cn(
                          "transition-colors group/row",
                          hasTransactions 
                            ? "cursor-pointer hover:bg-muted/30 dark:hover:bg-muted/15" 
                            : "opacity-85"
                        )}
                      >
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-semibold text-foreground/80">
                          {item.label}
                          {hasTransactions && (
                            <Badge className="ml-1 sm:ml-2 scale-75 sm:scale-85 origin-left rounded-md bg-primary/10 border-primary/20 text-primary text-[8px] sm:text-[9px] font-bold leading-none py-0.5 px-1 sm:px-1.5">
                              {item.transactions.length} GD
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {item.income > 0 ? `+${item.income.toLocaleString('vi-VN')}₫` : '—'}
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          {item.expense > 0 ? `-${item.expense.toLocaleString('vi-VN')}₫` : '—'}
                        </td>
                        <td className={cn(
                          "py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-semibold tabular-nums",
                          netChange > 0 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : netChange < 0 
                            ? "text-rose-600 dark:text-rose-400" 
                            : "text-muted-foreground/60"
                        )}>
                          {netChange > 0 
                            ? `+${netChange.toLocaleString('vi-VN')}₫` 
                            : netChange < 0 
                            ? `${netChange.toLocaleString('vi-VN')}₫` 
                            : '—'
                          }
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-extrabold text-foreground tabular-nums">
                          {item.balance.toLocaleString('vi-VN')}₫
                        </td>
                        <td className="py-2.5 sm:py-3.5 px-1 sm:px-3 text-center">
                          {hasTransactions ? (
                            <ChevronRightIcon className="size-3.5 sm:size-4 mx-auto text-muted-foreground/60 transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-foreground" />
                          ) : (
                            <span className="text-muted-foreground/30 font-light">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PrivatePageShell>

      {/* Dialog sửa tài khoản */}
      <AccountFormDialog
        key={account.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        account={account}
        onSuccess={() => {
          refetchAll();
        }}
      />

      {/* Dialog chi tiết các giao dịch của ngày/tháng được click */}
      {selectedBucket && (
        <DayTransactionsDialog
          open={!!selectedBucket}
          onOpenChange={(open) => {
            if (!open) setSelectedBucket(null);
          }}
          title={selectedBucket.label}
          transactions={selectedBucket.transactions}
          onUpdate={(t) => {
            setSelectedTx(t);
            setUpdateTxOpen(true);
          }}
          onDelete={handleDeleteTx}
        />
      )}

      {/* Dialog sửa giao dịch */}
      <UpdateTransactionDialog
        open={updateTxOpen}
        onOpenChange={setUpdateTxOpen}
        transaction={selectedTx}
        onSuccess={refetchAll}
      />
    </>
  );
}
