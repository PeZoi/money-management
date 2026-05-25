'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { 
  TrendingUpIcon, 
  PieChartIcon, 
  BarChart3Icon, 
  HelpCircleIcon,
  ArrowRightLeftIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon
} from 'lucide-react';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';

// Format tiền tệ VND
const formatVnd = (amount: number | string): string => {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return '0₫';
  return n.toLocaleString('vi-VN') + '₫';
};

// Mảng màu sắc phong phú, tươi tắn cho Pie Chart (Tailwind-like colors)
const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#a855f7', // purple
  '#6366f1', // indigo
];

// Cấu hình màu sắc của biểu đồ Shadcn Chart
const chartConfig = {
  income: {
    label: 'Thu nhập',
    color: '#10b981', // emerald-500
  },
  expense: {
    label: 'Chi tiêu',
    color: '#f43f5e', // rose-500
  },
} satisfies ChartConfig;

// Tooltip cho Donut Chart
interface CustomPieTooltipProps {
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
}

const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/50 rounded-2xl p-3 shadow-xl text-xs font-semibold flex flex-col gap-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-2">
          <div className="size-5 shrink-0 flex items-center justify-center rounded bg-muted overflow-hidden text-muted-foreground">
            {data.id !== 'other' ? (
              <IconPreview name={data.icon} className="size-3.5" />
            ) : (
              <HelpCircleIcon className="size-3.5" />
            )}
          </div>
          <span className="text-foreground font-bold">{data.name}</span>
          <span className="text-muted-foreground text-[10px] font-semibold">({data.percentage}%)</span>
        </div>
        <p className="text-rose-500 font-extrabold tabular-nums pl-7">
          -{formatVnd(data.amount)}
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardChartsProps {
  isLoading: boolean;
  timeRange: 'week' | 'month' | 'year' | 'all';
  // Dữ liệu biểu đồ xu hướng
  trendData: Array<{
    time: string;
    income: number;
    expense: number;
    transactions: TransactionWithCategory[];
  }>;
  // Giao dịch hiện tại để phân tích Pie Chart
  currentTransactions: TransactionWithCategory[];
  // Giao dịch trước đó để click Bar Chart
  prevTransactions: TransactionWithCategory[];
  // Dữ liệu so sánh với chu kỳ trước
  comparisonData: {
    current: { label: string; income: number; expense: number };
    previous: { label: string; income: number; expense: number };
  };
  // Callback khi người dùng click xem chi tiết giao dịch
  onSelectBucket: (bucket: { label: string; transactions: TransactionWithCategory[] } | null) => void;
}

export function DashboardCharts({
  isLoading,
  timeRange,
  trendData,
  currentTransactions,
  prevTransactions,
  comparisonData,
  onSelectBucket,
}: DashboardChartsProps) {
  const diffIncome = (comparisonData?.current?.income || 0) - (comparisonData?.previous?.income || 0);
  const diffExpense = (comparisonData?.current?.expense || 0) - (comparisonData?.previous?.expense || 0);
  
  // 1. Xử lý dữ liệu Donut Chart (Chỉ lấy giao dịch 'expense' trong chu kỳ hiện tại)
  const categoryStats = React.useMemo(() => {
    const safeCurrentTx = currentTransactions || [];
    const expenses = safeCurrentTx.filter((t) => t && t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const groups: Record<string, { id: string; name: string; icon: string; amount: number }> = {};
    
    expenses.forEach((t) => {
      const catId = t.category_id || 'other';
      const catName = t.category?.name || 'Khác';
      const catIcon = t.category?.icon || 'help-circle';
      const amount = Number(t.amount || 0);

      if (groups[catId]) {
        groups[catId].amount += amount;
      } else {
        groups[catId] = {
          id: catId,
          name: catName,
          icon: catIcon,
          amount,
        };
      }
    });

    const data = Object.values(groups)
      .map((item, idx) => ({
        ...item,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data, totalExpense };
  }, [currentTransactions]);

  // 2. Định dạng dữ liệu Bar Chart so sánh (React Compiler sẽ tự động memoize mảng này dưới hạ tầng)
  const barChartData = [
    {
      name: comparisonData.previous.label,
      income: comparisonData.previous.income,
      expense: comparisonData.previous.expense,
    },
    {
      name: comparisonData.current.label,
      income: comparisonData.current.income,
      expense: comparisonData.current.expense,
    },
  ];

  // Handler khi click vào danh mục trong Pie / list bên phải
  const handleCategoryClick = (catId: string, catName: string) => {
    const safeCurrentTx = currentTransactions || [];
    const catTransactions = safeCurrentTx.filter((t) => {
      if (!t || t.type !== 'expense') return false;
      const tCatId = t.category_id || 'other';
      return tCatId === catId;
    });

    onSelectBucket({
      label: `Chi tiêu danh mục: ${catName}`,
      transactions: catTransactions,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border bg-card/60 rounded-3xl p-5 shadow-xs"><Skeleton className="h-[300px] w-full rounded-2xl" /></div>
        <div className="border bg-card/60 rounded-3xl p-5 shadow-xs"><Skeleton className="h-[300px] w-full rounded-2xl" /></div>
        <div className="lg:col-span-3 border bg-card/60 rounded-3xl p-5 shadow-xs"><Skeleton className="h-[250px] w-full rounded-2xl" /></div>
      </div>
    );
  }

  const isTrendEmpty = trendData.length === 0 || trendData.every(d => d.income === 0 && d.expense === 0);
  const isPieEmpty = categoryStats.data.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Area Chart: Xu hướng dòng tiền */}
      <div className="lg:col-span-2 border bg-card/60 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xs hover:border-primary/20 transition-all duration-300 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 flex items-center gap-2 select-none">
            <TrendingUpIcon className="size-4 text-emerald-500" />
            Xu hướng dòng tiền
          </h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md uppercase tracking-wider select-none">
            {timeRange === 'week' ? 'Tuần này' : timeRange === 'month' ? 'Tháng này' : timeRange === 'year' ? 'Năm nay' : 'Tất cả'}
          </span>
        </div>

        {isTrendEmpty ? (
          <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground text-sm border border-dashed border-muted/50 rounded-2xl bg-muted/5">
            <TrendingUpIcon className="size-8 opacity-30 mb-2" />
            <span>Không có dữ liệu thu chi trong chu kỳ này.</span>
          </div>
        ) : (
          <div className="flex-1 w-full min-h-[250px]">
            <ChartContainer config={chartConfig} className="h-full w-full cursor-pointer select-none">
              <AreaChart 
                data={trendData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state) => {
                  const indexVal = state?.activeTooltipIndex;
                  if (indexVal !== undefined && indexVal !== null) {
                    const index = Number(indexVal);
                    if (!isNaN(index) && index >= 0 && index < trendData.length) {
                      const dataPoint = trendData[index];
                      if (dataPoint.transactions && dataPoint.transactions.length > 0) {
                        let label = `Giao dịch (${dataPoint.time})`;
                        if (timeRange === 'week') {
                          label = `Giao dịch ${dataPoint.time}`;
                        } else if (timeRange === 'month') {
                          label = `Giao dịch ngày ${dataPoint.time}`;
                        } else if (timeRange === 'year') {
                          label = `Giao dịch ${dataPoint.time}`;
                        }
                        onSelectBucket({
                          label,
                          transactions: dataPoint.transactions,
                        });
                      }
                    }
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  minTickGap={25}
                  className="text-muted-foreground font-semibold text-[10px]"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  className="text-muted-foreground font-semibold text-[10px]"
                  tickFormatter={(value) => {
                    if (value === 0) return '0';
                    if (value >= 1000000) return `${(value / 1000000).toLocaleString('vi-VN')}M`;
                    if (value >= 1000) return `${(value / 1000).toLocaleString('vi-VN')}k`;
                    return value.toString();
                  }}
                />
                <ChartTooltip 
                  labelFormatter={(label) => {
                    if (timeRange === 'week') return `Giao dịch ${label}`;
                    if (timeRange === 'month') return `Ngày ${label}`;
                    if (timeRange === 'year') return `Tháng ${label.replace('T', '')}`;
                    if (timeRange === 'all') return `Tháng ${label}`;
                    return label;
                  }}
                  content={<ChartTooltipContent hideLabel={false} labelKey="time" indicator="dot" />} 
                />
                <ChartLegend content={<ChartLegendContent className="pt-2" />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="var(--color-income)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="expense"
                  stroke="var(--color-expense)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </div>

      {/* 2. Donut Chart: Cơ cấu chi tiêu */}
      <div className="border bg-card/60 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xs hover:border-primary/20 transition-all duration-300 flex flex-col">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 mb-6 flex items-center gap-2 select-none">
          <PieChartIcon className="size-4 text-rose-500" />
          Cơ cấu chi tiêu
        </h3>

        {isPieEmpty ? (
          <div className="flex-1 min-h-[250px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground text-sm border border-dashed border-muted/50 rounded-2xl bg-muted/5">
            <PieChartIcon className="size-8 opacity-30 mb-2" />
            <span>Không có giao dịch chi tiêu nào.</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-4">
            {/* Vùng vẽ biểu đồ tròn */}
            <div className="h-[150px] relative flex items-center justify-center cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="amount"
                    onClick={(state) => {
                      const data = state as unknown as { id?: string; name?: string };
                      if (data && data.id) {
                        handleCategoryClick(data.id, data.name || 'Khác');
                      }
                    }}
                  >
                    {categoryStats.data.map((entry) => (
                      <Cell key={`cell-${entry.id}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 100 }} />
                </PieChart>
              </ResponsiveContainer>

              {/* Label tổng tiền ở tâm Donut */}
              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none select-none">
                <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Tổng chi</span>
                <span className="text-xs sm:text-sm font-black text-foreground mt-1 tabular-nums">
                  {formatVnd(categoryStats.totalExpense)}
                </span>
              </div>
            </div>

            {/* Danh sách các danh mục chi tiêu */}
            <div className="space-y-1 max-h-[170px] overflow-y-auto pr-1 flex-1">
              {categoryStats.data.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleCategoryClick(item.id, item.name)}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-muted/40 transition-colors select-none cursor-pointer group/acc"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="size-7 shrink-0 flex items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 group-hover/acc:scale-105"
                      style={{
                        backgroundColor: `${item.color}15`,
                        border: `1px solid ${item.color}30`,
                        color: item.color
                      }}
                    >
                      {item.id !== 'other' ? (
                        <IconPreview name={item.icon} className="size-3.5" />
                      ) : (
                        <HelpCircleIcon className="size-3.5" />
                      )}
                    </div>
                    <span className="font-bold text-xs text-foreground/80 truncate group-hover/acc:text-foreground">{item.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-muted-foreground/80 leading-none">{item.percentage}%</span>
                      <div className="h-0.5 w-6 rounded-full mt-1 animate-in fade-in zoom-in" style={{ backgroundColor: item.color }} />
                    </div>
                    <span className="text-xs font-black text-foreground tabular-nums">
                      {formatVnd(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bar Chart: So sánh thu chi chu kỳ này với chu kỳ trước */}
      {timeRange !== 'all' && (
        <div className="lg:col-span-3 border bg-card/60 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-xs hover:border-primary/20 transition-all duration-300">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 mb-5 flex items-center gap-2 select-none">
            <BarChart3Icon className="size-4 text-blue-500" />
            So sánh chu kỳ dòng tiền
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Biểu đồ cột */}
            <div className="md:col-span-2 h-[160px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full cursor-pointer select-none">
                <BarChart 
                  data={barChartData} 
                  margin={{ top: 0, right: 10, left: -20, bottom: 0 }} 
                  barGap={6}
                  onClick={(state) => {
                    const indexVal = state?.activeTooltipIndex;
                    if (indexVal !== undefined && indexVal !== null) {
                      const index = Number(indexVal);
                      if (index === 0) {
                        onSelectBucket({
                          label: `Giao dịch chu kỳ trước (${comparisonData.previous.label})`,
                          transactions: prevTransactions || [],
                        });
                      } else if (index === 1) {
                        onSelectBucket({
                          label: `Giao dịch chu kỳ này (${comparisonData.current.label})`,
                          transactions: currentTransactions || [],
                        });
                      }
                    }
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    className="text-muted-foreground font-semibold text-[10px]"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-muted-foreground font-semibold text-[10px]"
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value >= 1000000) return `${(value / 1000000).toLocaleString('vi-VN')}M`;
                      if (value >= 1000) return `${(value / 1000).toLocaleString('vi-VN')}k`;
                      return value.toString();
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent labelKey="name" indicator="dot" />} />
                  <Bar
                    dataKey="income"
                    name="income"
                    fill="var(--color-income)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="expense"
                    name="expense"
                    fill="var(--color-expense)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Chỉ số thay đổi nhanh */}
            <div className="space-y-4">
              <div 
                className="rounded-2xl bg-muted/30 p-3 sm:p-4 border border-border/40 flex flex-col gap-1.5 transition-colors group/inc"
              >
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">Biến động Thu nhập</span>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black group-hover/inc:text-primary tabular-nums ${
                    diffIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {formatVnd(Math.abs(diffIncome))}
                  </span>
                  
                  {diffIncome >= 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full select-none">
                      <ArrowUpRightIcon className="size-3" />
                      Tăng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full select-none">
                      <ArrowDownRightIcon className="size-3" />
                      Giảm
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold border-t border-border/20 pt-1.5 mt-0.5 leading-normal">
                  {diffIncome >= 0 ? (
                    <span>
                      <strong className="text-foreground/80">{comparisonData.current.label}</strong> thu nhập <span className="text-emerald-500 font-bold">nhiều hơn</span> so với {comparisonData.previous.label} <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatVnd(diffIncome)}</strong>
                    </span>
                  ) : (
                    <span>
                      <strong className="text-foreground/80">{comparisonData.current.label}</strong> thu nhập <span className="text-rose-500 font-bold">ít hơn</span> so với {comparisonData.previous.label} <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{formatVnd(Math.abs(diffIncome))}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div 
                className="rounded-2xl bg-muted/30 p-3 sm:p-4 border border-border/40 flex flex-col gap-1.5 transition-colors group/exp"
              >
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest select-none">Biến động Chi tiêu</span>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black group-hover/exp:text-primary tabular-nums ${
                    diffExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {formatVnd(Math.abs(diffExpense))}
                  </span>

                  {diffExpense >= 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full select-none">
                      <ArrowUpRightIcon className="size-3" />
                      Tăng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full select-none">
                      <ArrowDownRightIcon className="size-3" />
                      Giảm
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold border-t border-border/20 pt-1.5 mt-0.5 leading-normal">
                  {diffExpense >= 0 ? (
                    <span>
                      <strong className="text-foreground/80">{comparisonData.current.label}</strong> chi tiêu <span className="text-emerald-500 font-bold">nhiều hơn</span> so với {comparisonData.previous.label} <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{formatVnd(diffExpense)}</strong>
                    </span>
                  ) : (
                    <span>
                      <strong className="text-foreground/80">{comparisonData.current.label}</strong> chi tiêu <span className="text-rose-500 font-bold">ít hơn</span> so với {comparisonData.previous.label} <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{formatVnd(Math.abs(diffExpense))}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
