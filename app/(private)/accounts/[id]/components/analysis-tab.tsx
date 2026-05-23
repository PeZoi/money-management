'use client';

import IconPreview from '@/components/icons/icon-preview';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithCategory } from '@/types/database';
import { BarChart3Icon, HelpCircleIcon, PieChartIcon } from 'lucide-react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

// Cấu hình mặc định cho biểu đồ Shadcn Chart
const defaultChartConfig = {
  income: {
    label: 'Thu nhập',
    color: '#10b981', // Xanh lá
  },
  expense: {
    label: 'Chi tiêu',
    color: '#f43f5e', // Đỏ
  },
} satisfies ChartConfig;

interface AnalysisTabProps {
  isTxLoading: boolean;
  chartData: Array<{
    time: string;
    income: number;
    expense: number;
    transactions: TransactionWithCategory[];
  }>;
  categoryStats: {
    data: Array<{
      id: string;
      name: string;
      icon: string;
      amount: number;
      color: string;
      percentage: number;
    }>;
    totalExpense: number;
  };
  filteredPeriodTransactions: TransactionWithCategory[];
  accountId: string;
  filterType: 'month' | 'year';
  year: number;
  onSelectBucket: (bucket: { label: string; transactions: TransactionWithCategory[] } | null) => void;
}

export function AnalysisTab({
  isTxLoading,
  chartData,
  categoryStats,
  filteredPeriodTransactions,
  accountId,
  filterType,
  year,
  onSelectBucket,
}: AnalysisTabProps) {
  const idLower = accountId.toLowerCase();

  return (
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
        ) : chartData.length === 0 ? (
          <div className="h-[250px] w-full flex items-center justify-center text-center text-muted-foreground text-sm">
            Không có dữ liệu trong chu kỳ lọc.
          </div>
        ) : (
          <ChartContainer config={defaultChartConfig} className="h-[250px] w-full cursor-pointer select-none">
            <LineChart
              data={chartData}
              onClick={(state) => {
                const indexVal = state?.activeTooltipIndex;
                if (indexVal !== undefined && indexVal !== null) {
                  const index = Number(indexVal);
                  if (!isNaN(index) && index >= 0 && index < chartData.length) {
                    const dataPoint = chartData[index];
                    if (dataPoint.transactions && dataPoint.transactions.length > 0) {
                      const formattedLabel = filterType === 'month'
                        ? `Giao dịch ngày ${dataPoint.time}/${year}`
                        : `Giao dịch tháng ${dataPoint.time}/${year}`;
                      
                      onSelectBucket({
                        label: formattedLabel,
                        transactions: dataPoint.transactions,
                      });
                    } else {
                      console.log("No transactions found for this data point.");
                    }
                  }
                }
              }}
            >
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                    const catTransactions = filteredPeriodTransactions.filter(t => {
                      // Chỉ lấy giao dịch chi tiêu (bao gồm expense và transfer đi của tài khoản này)
                      const isExpenseOrTransferOut = 
                        (t.type === 'expense' && t.account_id?.toLowerCase() === idLower) ||
                        (t.type === 'transfer' && t.account_id?.toLowerCase() === idLower);
                      
                      if (!isExpenseOrTransferOut) return false;
                      
                      const tCatId = t.category_id || 'other';
                      return tCatId === item.id;
                    });
                    onSelectBucket({
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
  );
}
