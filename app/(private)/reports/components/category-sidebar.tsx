'use client';

import {
  CalendarIcon,
  GripVerticalIcon,
  HashIcon,
  PackageIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import type { CategoryUi } from '@/types/category';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';

// ─── Sidebar danh mục và giao dịch kéo thả ───────────────

interface CategorySidebarProps {
  categories: CategoryUi[];
  usedCategoryIds: Set<string>;
  transactions: TransactionWithCategory[];
  onDeleteColumn?: (tableId: string, columnId: string) => void;
}

export function CategorySidebar({
  categories,
  usedCategoryIds,
  transactions,
  onDeleteColumn,
}: CategorySidebarProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'transactions' | 'system'>('categories');
  const [isDragOverCol, setIsDragOverCol] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  // Lọc các giao dịch chưa thuộc về danh mục nào đã kéo vào bảng
  const displayTransactions = transactions.filter(
    (tx) => !tx.category_id || !usedCategoryIds.has(tx.category_id)
  );

  const expenseTransactions = displayTransactions.filter((tx) => tx.type === 'expense');
  const incomeTransactions = displayTransactions.filter((tx) => tx.type === 'income');

  const handleDragOverCol = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/report-column-id')) {
      e.preventDefault();
      setIsDragOverCol(true);
    }
  };

  const handleDragLeaveCol = () => {
    setIsDragOverCol(false);
  };

  const handleDropCol = (e: React.DragEvent) => {
    const columnId = e.dataTransfer.getData('application/report-column-id');
    const tableId = e.dataTransfer.getData('application/report-source-table-id');
    if (columnId && tableId && onDeleteColumn) {
      e.preventDefault();
      onDeleteColumn(tableId, columnId);
      setIsDragOverCol(false);
      toast.success('Đã loại bỏ cột khỏi bảng');
    }
  };

  return (
    <aside
      className="hidden lg:block w-64 shrink-0 sticky top-20 self-start"
      onDragOver={handleDragOverCol}
      onDragLeave={handleDragLeaveCol}
      onDrop={handleDropCol}
    >
      <div className={cn(
        'rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[82vh] transition-all duration-200',
        isDragOverCol && 'ring-2 ring-rose-500/50 border-rose-500/40 bg-rose-500/5 scale-[1.02]',
      )}>
        {/* Header */}
        <div className={cn(
          'px-4 py-3 border-b bg-linear-to-r from-primary/5 to-transparent transition-colors duration-200',
          isDragOverCol && 'from-rose-500/10 border-rose-500/20',
        )}>
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <PackageIcon className={cn('size-4 text-primary transition-all duration-200', isDragOverCol && 'text-rose-500 animate-bounce')} />
            {isDragOverCol ? 'Thả vào đây để xóa cột' : 'Thiết lập báo cáo'}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isDragOverCol ? 'Thả cột để xóa khỏi bảng báo cáo' : 'Kéo thả danh mục hoặc giao dịch vào bảng'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-muted/20 p-1 gap-1">
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'categories'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background/50',
            )}
          >
            Danh mục
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all relative cursor-pointer',
              activeTab === 'transactions'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background/50',
            )}
          >
            Giao dịch
            {displayTransactions.length > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm scale-90">
                {displayTransactions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'system'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background/50',
            )}
          >
            Hệ thống
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y">
          {activeTab === 'categories' && (
            <>
              {/* Chi tiêu */}
              <div className="px-3 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 mb-2 px-1">
                  Chi tiêu
                </h4>
                <div className="space-y-1">
                  {expenseCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 px-1">Chưa có danh mục</p>
                  ) : (
                    expenseCategories.map((cat) => (
                      <DraggableCategory
                        key={cat.id}
                        category={cat}
                        isUsed={usedCategoryIds.has(cat.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Thu nhập */}
              <div className="px-3 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80 mb-2 px-1">
                  Thu nhập
                </h4>
                <div className="space-y-1">
                  {incomeCategories.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 px-1">Chưa có danh mục</p>
                  ) : (
                    incomeCategories.map((cat) => (
                      <DraggableCategory
                        key={cat.id}
                        category={cat}
                        isUsed={usedCategoryIds.has(cat.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'transactions' && (
            <>
              {/* Giao dịch Chi tiêu */}
              <div className="px-3 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 mb-2 px-1 flex items-center justify-between">
                  <span>Chi tiêu chưa xếp</span>
                  {expenseTransactions.length > 0 && (
                    <span className="text-[9px] font-normal text-muted-foreground">{expenseTransactions.length}</span>
                  )}
                </h4>
                <div className="space-y-1.5 mt-2">
                  {expenseTransactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 px-1 py-4 text-center">Tất cả chi tiêu đã được xếp</p>
                  ) : (
                    expenseTransactions.map((tx) => (
                      <DraggableTransaction key={tx.id} transaction={tx} />
                    ))
                  )}
                </div>
              </div>

              {/* Giao dịch Thu nhập */}
              <div className="px-3 py-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80 mb-2 px-1 flex items-center justify-between">
                  <span>Thu nhập chưa xếp</span>
                  {incomeTransactions.length > 0 && (
                    <span className="text-[9px] font-normal text-muted-foreground">{incomeTransactions.length}</span>
                  )}
                </h4>
                <div className="space-y-1.5 mt-2">
                  {incomeTransactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground/50 px-1 py-4 text-center">Tất cả thu nhập đã được xếp</p>
                  ) : (
                    incomeTransactions.map((tx) => (
                      <DraggableTransaction key={tx.id} transaction={tx} />
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <div className="px-3 py-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-500/80 mb-2 px-1">
                Chỉ số hệ thống
              </h4>
              <div className="space-y-1">
                <DraggableSystemMetric
                  id="month_balance"
                  label="Số dư trong tháng"
                  icon={ScaleIcon}
                  color="text-amber-600 bg-amber-500/10"
                />
                <DraggableSystemMetric
                  id="account_balance"
                  label="Số dư tài khoản"
                  icon={WalletIcon}
                  color="text-blue-600 bg-blue-500/10"
                />
                <DraggableSystemMetric
                  id="total_income"
                  label="Tổng tiền thu nhập"
                  icon={TrendingUpIcon}
                  color="text-emerald-600 bg-emerald-500/10"
                />
                <DraggableSystemMetric
                  id="total_expense"
                  label="Tổng tiền chi"
                  icon={TrendingDownIcon}
                  color="text-rose-600 bg-rose-500/10"
                />
                <DraggableSystemMetric
                  id="avg_daily_expense"
                  label="Chi tiêu trung bình ngày"
                  icon={CalendarIcon}
                  color="text-orange-600 bg-orange-500/10"
                />
                <DraggableSystemMetric
                  id="transaction_count"
                  label="Tổng số lượng giao dịch"
                  icon={HashIcon}
                  color="text-indigo-600 bg-indigo-500/10"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Một item danh mục có thể kéo thả ────────────────

interface DraggableCategoryProps {
  category: CategoryUi;
  isUsed: boolean;
}

function DraggableCategory({ category, isUsed }: DraggableCategoryProps) {
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/report-category',
      JSON.stringify(category),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      ref={dragRef}
      draggable={!isUsed}
      onDragStart={handleDragStart}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all',
        isUsed
          ? 'opacity-40 cursor-not-allowed bg-muted/30'
          : 'cursor-grab active:cursor-grabbing hover:bg-accent/60 hover:shadow-sm active:scale-[0.97]',
      )}
      title={
        isUsed
          ? `"${category.name}" đã được sử dụng trong bảng`
          : `Kéo "${category.name}" vào bảng`
      }
    >
      <GripVerticalIcon
        className={cn(
          'size-3 shrink-0',
          isUsed ? 'text-muted-foreground/30' : 'text-muted-foreground/50',
        )}
      />
      <IconPreview name={category.icon} className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-xs font-medium">{category.name}</span>
      {isUsed && (
        <span className="ml-auto text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">
          Đã dùng
        </span>
      )}
    </div>
  );
}

// ─── Một card giao dịch có thể kéo thả ───────────────

function DraggableTransaction({ transaction }: { transaction: TransactionWithCategory }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/report-transaction',
      JSON.stringify(transaction),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs bg-background hover:bg-accent border hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing hover:shadow-sm active:scale-[0.98] group min-w-0"
      title={`Kéo giao dịch "${transaction.note || 'Không ghi chú'}" thả vào một cột danh mục thích hợp`}
    >
      <GripVerticalIcon className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0" />
      {transaction.category ? (
        <IconPreview name={transaction.category.icon} className="size-3.5 text-muted-foreground shrink-0" />
      ) : (
        <span className="text-sm shrink-0">🏷️</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground truncate">{transaction.note || 'Không ghi chú'}</p>
        <p className="text-[9px] text-muted-foreground/50 font-mono">
          {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
        </p>
      </div>
      <span className={cn(
        'font-bold tabular-nums shrink-0 text-[10px] ml-1',
        transaction.type === 'income' ? 'text-emerald-600' : 'text-foreground'
      )}>
        {new Intl.NumberFormat('vi-VN', { style: 'decimal', maximumFractionDigits: 0 }).format(Number(transaction.amount))}đ
      </span>
    </div>
  );
}

// ─── Một chỉ số hệ thống có thể kéo thả ───────────────

interface DraggableSystemMetricProps {
  id: 'month_balance' | 'account_balance' | 'total_expense' | 'total_income';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function DraggableSystemMetric({ id, label, icon: Icon, color }: DraggableSystemMetricProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/report-system-metric',
      JSON.stringify({ id, label }),
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all cursor-grab active:cursor-grabbing hover:bg-accent/60 hover:shadow-sm active:scale-[0.97]"
      title={`Kéo "${label}" vào bảng`}
    >
      <GripVerticalIcon className="size-3 shrink-0 text-muted-foreground/50" />
      <span className={cn('inline-flex items-center justify-center size-5.5 rounded-lg shrink-0', color)}>
        <Icon className="size-3" />
      </span>
      <span className="truncate text-xs font-semibold">{label}</span>
    </div>
  );
}
