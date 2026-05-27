'use client';

import { GripVerticalIcon, PackageIcon, HelpCircleIcon } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { CategoryUi } from '@/types/category';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';

// ─── Sidebar danh mục và giao dịch kéo thả ───────────────

interface CategorySidebarProps {
  categories: CategoryUi[];
  usedCategoryIds: Set<string>;
  transactions: TransactionWithCategory[];
}

export function CategorySidebar({ categories, usedCategoryIds, transactions }: CategorySidebarProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'transactions'>('categories');

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  // Lọc các giao dịch chưa thuộc về danh mục nào đã kéo vào bảng
  const displayTransactions = transactions.filter(
    (tx) => !tx.category_id || !usedCategoryIds.has(tx.category_id)
  );

  const expenseTransactions = displayTransactions.filter((tx) => tx.type === 'expense');
  const incomeTransactions = displayTransactions.filter((tx) => tx.type === 'income');

  return (
    <aside className="hidden lg:block w-64 shrink-0 sticky top-20 self-start">
      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[82vh] transition-all">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <PackageIcon className="size-4 text-primary" />
            Thiết lập báo cáo
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Kéo thả danh mục hoặc giao dịch vào bảng
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
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y">
          {activeTab === 'categories' ? (
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
          ) : (
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
        <HelpCircleIcon className="size-3.5 text-muted-foreground shrink-0" />
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
