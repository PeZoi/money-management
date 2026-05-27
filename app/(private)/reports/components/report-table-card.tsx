'use client';

import {
  CalculatorIcon,
  ColumnsIcon,
  EyeIcon,
  EyeOffIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RowsIcon,
  ScaleIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
  XIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TransactionWithCategory } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTransactionMutation } from '@/hooks/use-transactions';
import { useAccounts } from '@/hooks/use-accounts';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import { toast } from 'sonner';
import { formatAmountInput, parseAmount } from '@/lib/validations/transaction-schema';
import type {
  ReportColumn,
  ReportTable,
  ReportDummyTransaction,
} from '@/types/report';
import type { CategoryUi } from '@/types/category';
import IconPreview from '@/components/icons/icon-preview';

import {
  decompileFormula,
  evaluateFormula,
  indexToLabel,
} from '../lib/formula-engine';

// ─── Helpers ─────────────────────────────────────────

/** Format số tiền VND */
function formatVnd(value: number): string {
  if (value === 0) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Lấy class màu sắc số tiền theo loại cột */
function getColumnValueColorClass(col: ReportColumn, val: number): string {
  if (val === 0) return 'text-muted-foreground/40';

  if (col.kind === 'formula') {
    return 'text-foreground font-bold';
  }
  if (col.kind === 'system') {
    return 'text-foreground font-semibold';
  }
  return 'text-foreground';
}

/** Lấy class màu nền và màu icon cho chỉ số hệ thống */
function getSystemMetricIconClass(metric: string): string {
  switch (metric) {
    case 'month_balance':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'account_balance':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'total_income':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    case 'total_expense':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

// ─── Props ───────────────────────────────────────────

interface ReportTableCardProps {
  table: ReportTable;
  transactions: TransactionWithCategory[];
  month: string;
  onRenameTable: (tableId: string, newName: string) => void;
  onDeleteTable: (tableId: string) => void;
  onDropCategory: (tableId: string, category: CategoryUi) => void;
  onDeleteColumn: (tableId: string, columnId: string) => void;
  onRenameColumn: (tableId: string, columnId: string, newName: string) => void;
  onReorderColumns: (tableId: string, newColumns: ReportColumn[]) => void;
  onOpenFormulaDialog: (tableId: string, editColumn?: ReportColumn) => void;
  onAssignTransaction?: (tableId: string, columnId: string, transactionId: string) => void;
  onUnassignTransaction?: (tableId: string, columnId: string, transactionId: string) => void;
  onUpdateTableLayout?: (tableId: string, layout: 'horizontal' | 'vertical') => void;
  onUpdateTableShowTotals?: (tableId: string, showTotals: boolean) => void;
  onUpdateColumn?: (tableId: string, columnId: string, updatedColumn: ReportColumn) => void;
  dragHandle: ReactNode;
}

export function ReportTableCard({
  table,
  transactions,
  month,
  onRenameTable,
  onDeleteTable,
  onDropCategory,
  onDeleteColumn,
  onRenameColumn,
  onReorderColumns,
  onOpenFormulaDialog,
  onAssignTransaction,
  onUnassignTransaction,
  onUpdateTableLayout,
  onUpdateTableShowTotals,
  onUpdateColumn,
  dragHandle,
}: ReportTableCardProps) {
  const { columns } = table;
  const { accounts } = useAccounts();

  // State để chỉnh sửa nhanh số tiền giao dịch
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  // State lưu ID cột của ô giao dịch đang được click sửa
  const [editingColumnIdForTx, setEditingColumnIdForTx] = useState<string | null>(null);

  // State lưu ID cột đang dragover giao dịch từ sidebar
  const [activeDragOverColId, setActiveDragOverColId] = useState<string | null>(null);

  // State hiển thị danh sách giao dịch của cột danh mục
  const [selectedColumnForTransactions, setSelectedColumnForTransactions] = useState<ReportColumn | null>(null);

  // Timer để phân biệt click đơn và click đúp trên tiêu đề cột danh mục
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Xử lý co giãn cột (Resize) cho bảng ngang
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const thElement = (e.target as HTMLElement).closest('th');
    if (!thElement) return;
    const startWidth = thElement.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      
      // Áp dụng độ rộng trực tiếp lên phần tử DOM th
      thElement.style.width = `${newWidth}px`;
      thElement.style.minWidth = `${newWidth}px`;
      thElement.style.maxWidth = `${newWidth}px`;
      
      // Tìm index của cột
      const colIndex = Array.from(thElement.parentNode?.children || []).indexOf(thElement);
      const tableEl = thElement.closest('table');
      if (tableEl) {
        // Cập nhật tất cả các td thuộc cột này trong body và footer
        const rows = tableEl.querySelectorAll('tbody tr, tfoot tr');
        rows.forEach((row) => {
          const cell = row.children[colIndex] as HTMLElement;
          if (cell) {
            cell.style.width = `${newWidth}px`;
            cell.style.minWidth = `${newWidth}px`;
            cell.style.maxWidth = `${newWidth}px`;
          }
        });
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      const finalWidth = Math.max(80, startWidth + (upEvent.clientX - startX));
      const col = columns.find((c) => c.id === colId);
      if (col && onUpdateColumn) {
        onUpdateColumn(table.id, colId, { ...col, width: finalWidth });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);

  const handleHeaderClick = (col: ReportColumn) => {
    if (editingColumnId === col.id) return;

    if (clickTimeoutRef.current) {
      // Click lần thứ 2 -> Hủy timer và bắt đầu sửa tên cột/dòng
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setActiveMenuColId(null);
      startEditColumn(col);
    } else {
      // Click lần đầu -> Chờ xem có click thứ hai không
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (editingColumnId !== col.id) {
          setActiveMenuColId(col.id);
        }
      }, 250);
    }
  };

  // Xử lý kéo giao dịch qua tiêu đề cột danh mục
  const handleColDragOverTx = (e: React.DragEvent, col: ReportColumn) => {
    if (col.kind !== 'category') return;
    if (e.dataTransfer.types.includes('application/report-transaction')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (activeDragOverColId !== col.id) {
        setActiveDragOverColId(col.id);
      }
    }
  };

  const handleColDragLeaveTx = () => {
    setActiveDragOverColId(null);
  };

  // Xử lý thả giao dịch vào tiêu đề cột để phân loại danh mục (visually, chỉ cập nhật visual config)
  const handleColDropTx = (e: React.DragEvent, col: ReportColumn) => {
    if (col.kind !== 'category') return;
    e.preventDefault();
    e.stopPropagation();
    setActiveDragOverColId(null);

    const raw = e.dataTransfer.getData('application/report-transaction');
    if (!raw) return;

    try {
      const transaction = JSON.parse(raw) as TransactionWithCategory;

      // Kiểm tra trùng loại thu/chi
      if (transaction.type !== col.categoryType) {
        toast.error(
          `Không thể xếp giao dịch ${transaction.type === 'expense' ? 'chi' : 'thu'} vào cột ${col.categoryType === 'expense' ? 'chi' : 'thu'
          }`
        );
        return;
      }

      if (onAssignTransaction) {
        onAssignTransaction(table.id, col.id, transaction.id);
        toast.success(`Đã xếp giao dịch "${transaction.note || 'Không ghi chú'}" vào cột "${col.displayName}"`);
      }
    } catch {
      // Bỏ qua lỗi
    }
  };

  // ─── Đổi tên bảng ─────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(table.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const startEditName = () => {
    setEditName(table.name);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const commitEditName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== table.name) {
      onRenameTable(table.id, trimmed);
    }
    setIsEditingName(false);
  };

  // ─── Đổi tên cột ──────────────────────────────────
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const colNameInputRef = useRef<HTMLInputElement>(null);

  const startEditColumn = (col: ReportColumn) => {
    setEditingColumnId(col.id);
    setEditColumnName(col.displayName);
    setTimeout(() => colNameInputRef.current?.focus(), 50);
  };

  const commitEditColumn = () => {
    if (editingColumnId) {
      const trimmed = editColumnName.trim();
      if (trimmed) {
        onRenameColumn(table.id, editingColumnId, trimmed);
      }
    }
    setEditingColumnId(null);
  };

  // ─── Drop zone cho danh mục ────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/report-category')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const raw = e.dataTransfer.getData('application/report-category');
      if (!raw) return;
      try {
        const category = JSON.parse(raw) as CategoryUi;
        onDropCategory(table.id, category);
      } catch {
        // Bỏ qua lỗi parse
      }
    },
    [onDropCategory, table.id],
  );

  // ─── Kéo thả sắp xếp cột ─────────────────────────
  const dragColId = useRef<string | null>(null);

  const handleColDragStart = (colId: string) => {
    dragColId.current = colId;
  };

  const handleColDragOver = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragColId.current || dragColId.current === targetColId) return;

    const from = columns.findIndex((c) => c.id === dragColId.current);
    const to = columns.findIndex((c) => c.id === targetColId);
    if (from === -1 || to === -1) return;

    const reordered = [...columns];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorderColumns(table.id, reordered);
  };

  const handleColDragEnd = () => {
    dragColId.current = null;
  };

  // ─── Tính toán dữ liệu bảng ───────────────────────

  // Lấy các cột chứa dữ liệu (để tham chiếu trong công thức)
  const dataColumns = useMemo(
    () => columns.filter((c) => c.kind === 'category' || c.kind === 'system'),
    [columns],
  );

  // Nhóm giao dịch theo từng cột danh mục (mặc định + gán visually thủ công + giao dịch giả)
  const columnTransactions = useMemo(() => {
    const map = new Map<string, (TransactionWithCategory | ReportDummyTransaction)[]>();
    const catCols = columns.filter((c) => c.kind === 'category');
    for (const col of catCols) {
      if (col.kind === 'category') {
        const systemTxs = transactions.filter(
          (t) =>
            t.category_id === col.categoryId ||
            (col.transactionIds ?? []).includes(t.id)
        );
        const dummyTxs = col.dummyTransactions ?? [];
        map.set(col.id, [...systemTxs, ...dummyTxs]);
      }
    }
    return map;
  }, [columns, transactions]);

  // Tìm số dòng tối đa qua tất cả các cột
  const maxRows = useMemo(() => {
    let max = 0;
    for (const txs of columnTransactions.values()) {
      if (txs.length > max) max = txs.length;
    }
    // Ít nhất 1 dòng trống nếu có cột
    return columns.length > 0 ? Math.max(max, 1) : 0;
  }, [columnTransactions, columns]);

  // Tính tổng cho từng cột
  const columnTotals = useMemo(() => {
    const totals = new Map<string, number>();

    // 1. Tính tổng cho cột danh mục (gồm giao dịch thật + giả)
    for (const col of columns) {
      if (col.kind === 'category') {
        const txs = columnTransactions.get(col.id) ?? [];
        totals.set(
          col.id,
          txs.reduce((sum, t) => sum + Number(t.amount), 0),
        );
      }
    }

    // 2. Tính tổng cho cột thống kê hệ thống
    const realIncomeTotal = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const realExpenseTotal = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalAccountBalance = accounts
      .reduce((sum, a) => sum + Number(a.balance), 0);

    for (const col of columns) {
      if (col.kind === 'system') {
        let value = 0;
        if (col.systemMetric === 'total_income') {
          value = realIncomeTotal;
        } else if (col.systemMetric === 'total_expense') {
          value = realExpenseTotal;
        } else if (col.systemMetric === 'month_balance') {
          value = realIncomeTotal - realExpenseTotal;
        } else if (col.systemMetric === 'account_balance') {
          value = totalAccountBalance;
        }
        totals.set(col.id, value);
      }
    }

    // 3. Tính tổng cho cột công thức dựa trên tổng các cột khác
    for (const col of columns) {
      if (col.kind === 'formula') {
        const result = evaluateFormula(col.formula, totals);
        totals.set(col.id, result ?? 0);
      }
    }
    return totals;
  }, [columns, columnTransactions, transactions, accounts]);

  // ─── Render ────────────────────────────────────────

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all',
        isDragOver && 'ring-2 ring-primary/50 border-primary/30 shadow-lg shadow-primary/10',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header bảng */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-muted/30 to-transparent">
        {dragHandle}

        {isEditingName ? (
          <Input
            ref={nameInputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitEditName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEditName();
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            className="h-7 w-48 text-sm font-semibold rounded-lg"
          />
        ) : (
          <button
            onDoubleClick={startEditName}
            className="text-sm font-semibold tracking-tight hover:text-primary transition-colors"
            title="Nhấp đúp để đổi tên"
          >
            {table.name}
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-primary"
            onClick={() => onOpenFormulaDialog(table.id)}
            title="Thêm cột công thức"
          >
            <CalculatorIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-primary"
            onClick={() => {
              if (onUpdateTableLayout) {
                onUpdateTableLayout(table.id, table.layout === 'vertical' ? 'horizontal' : 'vertical');
              }
            }}
            title={table.layout === 'vertical' ? 'Chuyển sang bảng dạng ngang' : 'Chuyển sang bảng dạng dọc'}
          >
            {table.layout === 'vertical' ? (
              <ColumnsIcon className="size-3.5" />
            ) : (
              <RowsIcon className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-primary"
            onClick={() => {
              if (onUpdateTableShowTotals) {
                onUpdateTableShowTotals(table.id, table.showTotals !== false ? false : true);
              }
            }}
            title={table.showTotals !== false ? 'Ẩn tổng cộng' : 'Hiển thị tổng cộng'}
          >
            {table.showTotals !== false ? (
              <EyeIcon className="size-3.5" />
            ) : (
              <EyeOffIcon className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteTable(table.id)}
            title="Xóa bảng"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Nội dung bảng */}
      {columns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Kéo danh mục từ thanh bên thả vào đây để thêm {table.layout === 'vertical' ? 'dòng' : 'cột'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-xs"
              onClick={() => onOpenFormulaDialog(table.id)}
            >
              <CalculatorIcon className="size-3 mr-1" />
              Thêm {table.layout === 'vertical' ? 'dòng' : 'cột'} công thức
            </Button>
          </div>
        </div>
      ) : table.layout === 'vertical' ? (
        // RENDER BẢNG DẠNG DỌC (VERTICAL)
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-12 whitespace-nowrap border-r border-border/40">
                  STT
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-r border-border/40">
                  Hạng mục (Hàng)
                </th>
                <th className="px-3 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-40 whitespace-nowrap">
                  Số tiền (VND)
                </th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, index) => {
                const val = columnTotals.get(col.id) ?? 0;
                const catIdx = dataColumns.findIndex((c) => c.id === col.id);
                const label = (col.kind === 'category' || col.kind === 'system') && catIdx >= 0
                  ? indexToLabel(catIdx)
                  : null;

                return (
                  <tr
                    key={col.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleColDragStart(col.id);
                    }}
                    onDragOver={(e) => {
                      // Kéo thả sắp xếp thứ tự dòng
                      handleColDragOver(e, col.id);
                      // Kéo thả giao dịch từ sidebar
                      handleColDragOverTx(e, col);
                    }}
                    onDragLeave={handleColDragLeaveTx}
                    onDrop={(e) => handleColDropTx(e, col)}
                    onDragEnd={handleColDragEnd}
                    className={cn(
                      'border-b last:border-b-0 hover:bg-muted/20 transition-colors cursor-grab active:cursor-grabbing group/row relative border-t-2 border-transparent',
                      col.kind === 'formula' && 'bg-amber-500/5',
                      activeDragOverColId === col.id && 'bg-primary/10 border-t-primary/70 scale-[1.01] shadow-sm',
                    )}
                  >
                    {/* Cột STT */}
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground/50 w-12 border-r border-border/40">
                      {index + 1}
                    </td>

                    {/* Cột Tên hạng mục */}
                    <td className="px-3 py-3 border-r border-border/40">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {label && (
                            <span className="inline-flex items-center justify-center size-5 rounded-md bg-primary/10 text-primary text-[9px] font-bold shrink-0">
                              {label}
                            </span>
                          )}
                          {col.kind === 'formula' && (
                            <span className="inline-flex items-center justify-center size-5 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
                              <CalculatorIcon className="size-3" />
                            </span>
                          )}
                          {col.kind === 'system' && (
                            <span className={cn("inline-flex items-center justify-center size-5 rounded-md shrink-0", getSystemMetricIconClass(col.systemMetric))}>
                              {col.systemMetric === 'account_balance' && <WalletIcon className="size-3" />}
                              {col.systemMetric === 'month_balance' && <ScaleIcon className="size-3" />}
                              {col.systemMetric === 'total_income' && <TrendingUpIcon className="size-3" />}
                              {col.systemMetric === 'total_expense' && <TrendingDownIcon className="size-3" />}
                            </span>
                          )}
                          {col.kind === 'category' && (
                            <IconPreview name={col.categoryIcon} className="size-3.5 shrink-0 text-muted-foreground" />
                          )}

                          {editingColumnId === col.id ? (
                            <Input
                              ref={colNameInputRef}
                              value={editColumnName}
                              onChange={(e) => setEditColumnName(e.target.value)}
                              onBlur={commitEditColumn}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEditColumn();
                                if (e.key === 'Escape') setEditingColumnId(null);
                              }}
                              className="h-5 w-32 text-xs rounded px-1 font-semibold"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <DropdownMenu
                              open={activeMenuColId === col.id}
                              onOpenChange={(open) => {
                                if (!open) setActiveMenuColId(null);
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHeaderClick(col);
                                  }}
                                  className="flex items-center gap-1.5 cursor-pointer group/trigger select-none"
                                >
                                  <span
                                    className="text-xs font-semibold truncate hover:text-primary transition-colors"
                                    title="Nhấp 1 lần để mở menu, nhấp đúp để đổi tên"
                                  >
                                    {col.displayName}
                                  </span>

                                  {/* Icon 3 chấm chỉ báo (Dropdown Indicator) */}
                                  <MoreVerticalIcon className="size-3.5 text-muted-foreground/40 group-hover/trigger:text-muted-foreground transition-colors shrink-0" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                {col.kind === 'category' && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedColumnForTransactions(col);
                                      setActiveMenuColId(null);
                                    }}
                                  >
                                    <EyeIcon className="size-4 mr-2" />
                                    Xem giao dịch
                                  </DropdownMenuItem>
                                )}
                                {(col.kind === 'formula' || col.kind === 'system' || (col.kind === 'category' && col.categoryId.startsWith('custom-'))) && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenFormulaDialog(table.id, col);
                                      setActiveMenuColId(null);
                                    }}
                                  >
                                    <PencilIcon className="size-4 mr-2" />
                                    {col.kind === 'formula' ? 'Sửa công thức' : 'Sửa cấu hình'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditColumn(col);
                                    setActiveMenuColId(null);
                                  }}
                                >
                                  <PencilIcon className="size-4 mr-2" />
                                  Đổi tên hiển thị
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteColumn(table.id, col.id);
                                    setActiveMenuColId(null);
                                  }}
                                >
                                  <Trash2Icon className="size-4 mr-2 text-destructive" />
                                  Xóa dòng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Nhãn loại hoặc công thức */}
                          {col.kind === 'category' && (
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider ml-1.5 shrink-0',
                                col.categoryType === 'expense'
                                  ? 'text-rose-500/60'
                                  : 'text-emerald-500/60',
                              )}
                            >
                              {col.categoryType === 'expense' ? 'Chi' : 'Thu'}
                            </span>
                          )}
                          {col.kind === 'formula' && (
                            <span className="text-[9px] font-medium text-amber-600/60 truncate max-w-[150px] ml-1.5 shrink-0">
                              = {decompileFormula(col.formula, columns)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Cột Số tiền */}
                    <td
                      onClick={(e) => {
                        if (col.kind === 'category') {
                          e.stopPropagation();
                          setSelectedColumnForTransactions(col);
                        }
                      }}
                      className={cn(
                        'px-3 py-3 text-right tabular-nums text-xs w-40',
                        col.kind === 'category' && 'cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 underline-offset-4',
                        getColumnValueColorClass(col, val)
                      )}
                    >
                      {formatVnd(val)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Dòng tổng cộng cho bảng dọc */}
            {table.showTotals !== false && (
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
                  <td className="px-3 py-3 text-center text-xs font-bold text-emerald-600 w-12 border-r border-border/40">
                    Σ
                  </td>
                  <td className="px-3 py-3 text-left text-xs font-bold text-emerald-600 border-r border-border/40">
                    Tổng thực thu/chi (chỉ cộng các dòng danh mục)
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm font-bold text-emerald-600 w-40">
                    {formatVnd(
                      Array.from(columnTotals.entries())
                        .filter(([colId]) => {
                          const col = columns.find((c) => c.id === colId);
                          return col?.kind === 'category';
                        })
                        .reduce((sum, [, val]) => sum + val, 0),
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        // RENDER BẢNG DẠNG NGANG (HORIZONTAL - CŨ)
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Header cột */}
            <thead>
              <tr className="border-b bg-muted/20">
                {/* Cột STT */}
                <th className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-12 whitespace-nowrap border-r border-border/40">
                  STT
                </th>
                {columns.map((col) => {
                  // Chỉ cột category và system mới có nhãn chữ cái
                  const catIdx = dataColumns.findIndex((c) => c.id === col.id);
                  const label = (col.kind === 'category' || col.kind === 'system') && catIdx >= 0
                    ? indexToLabel(catIdx)
                    : null;

                  return (
                    <th
                      key={col.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        handleColDragStart(col.id);
                      }}
                      onDragOver={(e) => {
                        // Kéo thả sắp xếp thứ tự cột
                        handleColDragOver(e, col.id);
                        // Kéo thả giao dịch từ sidebar
                        handleColDragOverTx(e, col);
                      }}
                      onDragLeave={handleColDragLeaveTx}
                      onDrop={(e) => handleColDropTx(e, col)}
                      onDragEnd={handleColDragEnd}
                      className={cn(
                        'px-3 py-2.5 text-right whitespace-nowrap cursor-grab active:cursor-grabbing group/col transition-all relative border-t-2 border-transparent border-r last:border-r-0 border-border/40',
                        col.kind === 'formula' && 'bg-amber-500/[0.02]',
                        col.kind === 'system' && 'bg-blue-500/[0.02]',
                        activeDragOverColId === col.id && 'bg-primary/10 border-t-primary/70 scale-[1.02] shadow-sm',
                      )}
                      style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          {label && (
                            <span className="inline-flex items-center justify-center size-5 rounded-md bg-primary/10 text-primary text-[9px] font-bold shrink-0">
                              {label}
                            </span>
                          )}
                          {col.kind === 'formula' && (
                            <span className="inline-flex items-center justify-center size-5 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
                              <CalculatorIcon className="size-3" />
                            </span>
                          )}
                          {col.kind === 'system' && (
                            <span className={cn("inline-flex items-center justify-center size-5 rounded-md shrink-0", getSystemMetricIconClass(col.systemMetric))}>
                              {col.systemMetric === 'account_balance' && <WalletIcon className="size-3" />}
                              {col.systemMetric === 'month_balance' && <ScaleIcon className="size-3" />}
                              {col.systemMetric === 'total_income' && <TrendingUpIcon className="size-3" />}
                              {col.systemMetric === 'total_expense' && <TrendingDownIcon className="size-3" />}
                            </span>
                          )}
                          {col.kind === 'category' && (
                            <IconPreview name={col.categoryIcon} className="size-3.5 shrink-0 text-muted-foreground" />
                          )}

                          {editingColumnId === col.id ? (
                            <Input
                              ref={colNameInputRef}
                              value={editColumnName}
                              onChange={(e) => setEditColumnName(e.target.value)}
                              onBlur={commitEditColumn}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEditColumn();
                                if (e.key === 'Escape') setEditingColumnId(null);
                              }}
                              className="h-5 w-24 text-xs rounded px-1"
                            />
                          ) : (
                            <DropdownMenu
                              open={activeMenuColId === col.id}
                              onOpenChange={(open) => {
                                if (!open) setActiveMenuColId(null);
                              }}
                            >
                              <DropdownMenuTrigger asChild>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHeaderClick(col);
                                  }}
                                  className="flex items-center gap-1 cursor-pointer group/trigger select-none"
                                >
                                  <span
                                    className="text-xs font-semibold truncate hover:text-primary transition-colors"
                                    title="Nhấp 1 lần để mở menu, nhấp đúp để đổi tên"
                                  >
                                    {col.displayName}
                                  </span>

                                  {col.kind === 'category' && (
                                    <span
                                      className={cn(
                                        'px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 scale-90 border',
                                        col.categoryType === 'expense'
                                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                                      )}
                                    >
                                      {col.categoryType === 'expense' ? 'Chi' : 'Thu'}
                                    </span>
                                  )}
                                  {col.kind === 'system' && (
                                    <span className="px-1 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[8px] font-bold uppercase tracking-wider shrink-0 scale-90">
                                      Hệ thống
                                    </span>
                                  )}

                                  {/* Icon 3 chấm chỉ báo (Dropdown Indicator) */}
                                  <MoreVerticalIcon className="size-3.5 text-muted-foreground/40 group-hover/trigger:text-muted-foreground transition-colors shrink-0" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-48">
                                {col.kind === 'category' && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedColumnForTransactions(col);
                                      setActiveMenuColId(null);
                                    }}
                                  >
                                    <EyeIcon className="size-4 mr-2" />
                                    Xem giao dịch
                                  </DropdownMenuItem>
                                )}
                                {(col.kind === 'formula' || col.kind === 'system' || (col.kind === 'category' && col.categoryId.startsWith('custom-'))) && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenFormulaDialog(table.id, col);
                                      setActiveMenuColId(null);
                                    }}
                                  >
                                    <PencilIcon className="size-4 mr-2" />
                                    {col.kind === 'formula' ? 'Sửa công thức' : 'Sửa cấu hình'}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditColumn(col);
                                    setActiveMenuColId(null);
                                  }}
                                >
                                  <PencilIcon className="size-4 mr-2" />
                                  Đổi tên hiển thị
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteColumn(table.id, col.id);
                                    setActiveMenuColId(null);
                                  }}
                                >
                                  <Trash2Icon className="size-4 mr-2 text-destructive" />
                                  Xóa cột
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* Badge loại cột */}
                      {col.kind === 'category' && (
                        <span
                          className={cn(
                            'mt-0.5 inline-block text-[9px] font-bold uppercase tracking-wider',
                            col.categoryType === 'expense'
                              ? 'text-rose-500/60'
                              : 'text-emerald-500/60',
                          )}
                        >
                          {col.categoryType === 'expense' ? 'Chi' : 'Thu'}
                        </span>
                      )}
                      {col.kind === 'system' && (
                        <span className="mt-0.5 inline-block text-[9px] font-bold uppercase tracking-wider text-blue-500/60 truncate max-w-[100px]">
                          Hệ thống
                        </span>
                      )}
                      {col.kind === 'formula' && (
                        <span className="mt-0.5 inline-block text-[9px] font-medium text-amber-600/60 truncate max-w-[100px]">
                          = {decompileFormula(col.formula, columns)}
                        </span>
                      )}
                      {/* Resizer */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, col.id)}
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/60 active:bg-primary z-10 opacity-0 group-hover/col:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      />
                    </th>
                  );
                })}

                {/* Cột tổng */}
                {table.showTotals !== false && (
                  <th className="px-3 py-2.5 text-right whitespace-nowrap bg-primary/5 min-w-[120px] border-l border-border/40">
                    <span className="text-xs font-bold text-primary">Tổng</span>
                  </th>
                )}
                {/* Cột Spacer để hấp thụ chiều rộng thừa, tránh kéo dãn cột Tổng */}
                <th className="p-0 border-none bg-transparent w-auto"></th>
              </tr>
            </thead>

            {/* Dữ liệu */}
            <tbody>
              {Array.from({ length: maxRows }, (_, rowIdx) => {
                // Tính tổng hàng ngang (chỉ cộng cột category)
                let rowTotal = 0;
                const rowColValues = new Map<string, number>();

                // Lần 1: tính giá trị cột category
                for (const col of columns) {
                  if (col.kind === 'category') {
                     const txs = columnTransactions.get(col.id) ?? [];
                     const val = txs[rowIdx] ? Number(txs[rowIdx].amount) : 0;
                     rowColValues.set(col.id, val);
                     rowTotal += val;
                  }
                }

                // Lần 2: tính giá trị cột formula
                for (const col of columns) {
                  if (col.kind === 'formula') {
                    const result = evaluateFormula(col.formula, rowColValues);
                    rowColValues.set(col.id, result ?? 0);
                  }
                }

                return (
                  <tr
                    key={rowIdx}
                    className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground/50 border-r border-border/40">
                      {rowIdx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = rowColValues.get(col.id) ?? 0;
                      const isCategoryCol = col.kind === 'category';
                      const txs = isCategoryCol ? (columnTransactions.get(col.id) ?? []) : [];
                      const tx = isCategoryCol ? txs[rowIdx] : null;

                      return (
                        <td
                          key={col.id}
                          onClick={() => {
                            if (tx) {
                              const isDummy = !('account_id' in tx);
                              if (isDummy) {
                                setSelectedColumnForTransactions(col);
                              } else {
                                setEditingTransaction(tx as TransactionWithCategory);
                                setEditingColumnIdForTx(col.id); // Lưu cột của giao dịch đang click
                              }
                            }
                          }}
                          style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                          className={cn(
                            'px-3 py-2 text-right tabular-nums text-xs border-r last:border-r-0 border-border/40',
                            col.kind === 'formula' && 'bg-amber-500/[0.01]',
                            col.kind === 'system' && 'bg-blue-500/[0.01]',
                            tx && 'cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 underline-offset-4',
                            getColumnValueColorClass(col, val)
                          )}
                          title={tx ? `Nhấp để sửa giá trị giao dịch: ${tx.note || 'Không có ghi chú'}` : undefined}
                        >
                          {col.kind === 'system' ? (rowIdx === 0 ? formatVnd(columnTotals.get(col.id) ?? 0) : '—') : formatVnd(val)}
                        </td>
                      );
                    })}
                    {table.showTotals !== false && (
                      <td className="px-3 py-2 text-right tabular-nums text-xs font-medium bg-primary/5 text-primary border-l border-border/40">
                        {formatVnd(rowTotal)}
                      </td>
                    )}
                    {/* Cột Spacer */}
                    <td className="p-0 border-none bg-transparent"></td>
                  </tr>
                );
              })}
            </tbody>

            {/* Dòng tổng cộng */}
            {table.showTotals !== false && (
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-linear-to-r from-primary/5 to-primary/10">
                  <td className="px-3 py-3 text-center text-xs font-bold text-emerald-600 border-r border-border/40">
                    Σ
                  </td>
                  {columns.map((col) => {
                    const total = columnTotals.get(col.id) ?? 0;
                    return (
                      <td
                        key={col.id}
                        style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                        className={cn(
                          'px-3 py-3 text-right tabular-nums text-sm font-bold border-r last:border-r-0 border-border/40',
                          col.kind === 'formula'
                            ? 'text-amber-600'
                            : col.kind === 'system'
                              ? 'text-blue-600'
                              : col.kind === 'category'
                                ? 'text-emerald-600'
                                : 'text-foreground',
                        )}
                      >
                        {formatVnd(total)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right tabular-nums text-sm font-bold text-emerald-600 border-l border-border/40">
                    {formatVnd(
                      Array.from(columnTotals.entries())
                        .filter(([colId]) => {
                          const col = columns.find((c) => c.id === colId);
                          return col?.kind === 'category';
                        })
                        .reduce((sum, [, val]) => sum + val, 0),
                    )}
                  </td>
                  {/* Cột Spacer */}
                  <td className="p-0 border-none bg-transparent"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Drop indicator khi kéo thả */}
      {isDragOver && columns.length > 0 && (
        <div className="border-t border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-center">
          <p className="text-xs text-primary font-medium animate-pulse">
            <PlusIcon className="size-3 inline mr-1" />
            Thả danh mục để thêm cột mới
          </p>
        </div>
      )}

      {/* Dialog hiển thị danh sách giao dịch của cột */}
      <ColumnTransactionsDialog
        key={selectedColumnForTransactions ? `col-${selectedColumnForTransactions.id}` : 'closed'}
        column={selectedColumnForTransactions}
        transactions={selectedColumnForTransactions ? (columnTransactions.get(selectedColumnForTransactions.id) ?? []) : []}
        open={selectedColumnForTransactions !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedColumnForTransactions(null);
        }}
        onEditTransaction={(tx) => {
          setEditingTransaction(tx);
          setEditingColumnIdForTx(selectedColumnForTransactions?.id || null);
          setSelectedColumnForTransactions(null);
        }}
        onUnassignTransaction={(txId) => {
          if (selectedColumnForTransactions && onUnassignTransaction) {
            onUnassignTransaction(table.id, selectedColumnForTransactions.id, txId);
          }
        }}
        onUpdateColumn={(updatedColumn) => {
          if (selectedColumnForTransactions && onUpdateColumn) {
            onUpdateColumn(table.id, selectedColumnForTransactions.id, updatedColumn);
            setSelectedColumnForTransactions(updatedColumn);
          }
        }}
      />

      {/* Kiểm tra xem giao dịch đang sửa có phải được gán visually hay không */}
      {(() => {
        const isAssignedVisually = (() => {
          if (!editingTransaction || !editingColumnIdForTx) return false;
          const col = columns.find((c) => c.id === editingColumnIdForTx);
          if (col && col.kind === 'category') {
            return (col.transactionIds ?? []).includes(editingTransaction.id);
          }
          return false;
        })();

        return (
          <EditAmountDialog
            key={editingTransaction?.id || 'none'}
            transaction={editingTransaction}
            open={editingTransaction !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingTransaction(null);
                setEditingColumnIdForTx(null);
              }
            }}
            month={month}
            tableId={table.id}
            columnId={editingColumnIdForTx}
            isAssignedVisually={isAssignedVisually}
            onUnassignTransaction={onUnassignTransaction}
          />
        );
      })()}
    </div>
  );
}

// ─── Component con: Dialog chỉnh sửa số tiền giao dịch ───
interface EditAmountDialogProps {
  transaction: TransactionWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  tableId: string;
  columnId: string | null;
  isAssignedVisually: boolean;
  onUnassignTransaction?: (tableId: string, columnId: string, transactionId: string) => void;
}

function EditAmountDialog({
  transaction,
  open,
  onOpenChange,
  month,
  tableId,
  columnId,
  isAssignedVisually,
  onUnassignTransaction,
}: EditAmountDialogProps) {
  const [amount, setAmount] = useState(() =>
    transaction ? formatAmountInput(String(transaction.amount)) : ''
  );
  const { updateTransaction, isSubmitting } = useTransactionMutation();
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const handleChangeAmount = (val: string) => {
    setAmount(formatAmountInput(val));
  };

  const handleSave = async () => {
    if (!transaction) return;
    const parsedAmount = parseAmount(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (parsedAmount > 9999999999999) {
      toast.error('Số tiền quá lớn (tối đa 9,999,999,999,999đ)');
      return;
    }

    const success = await updateTransaction(transaction.id, {
      amount: parsedAmount,
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      note: transaction.note,
      created_at: transaction.created_at,
    });

    if (success) {
      // Invalidate cache giao dịch báo cáo để cập nhật giá tiền trên bảng ngay lập tức
      queryClient.invalidateQueries({
        queryKey: ['report-transactions', activeWorkspaceId, month],
      });
      onOpenChange(false);
    }
  };

  // Gỡ giao dịch khỏi cột danh mục (visually, chỉ cập nhật visual config)
  const handleRemoveFromColumn = () => {
    if (!transaction || !tableId || !columnId) return;

    if (onUnassignTransaction) {
      onUnassignTransaction(tableId, columnId, transaction.id);
      toast.success('Đã gỡ giao dịch khỏi cột danh mục');
      onOpenChange(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl focus-visible:outline-none">
        <DialogHeader className="space-y-1 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex items-center justify-center size-8 rounded-xl bg-emerald-500/10 text-emerald-600">
              <IconPreview name={transaction.category?.icon} className="size-4.5" />
            </span>
            Sửa số tiền giao dịch
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Thay đổi số tiền của giao dịch trực tiếp từ bảng báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border bg-muted/20 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Giao dịch:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{transaction.note || 'Không có ghi chú'}</span>
            </div>
            <div className="flex justify-between">
              <span>Danh mục:</span>
              <span className="font-medium text-foreground">{transaction.category?.name || 'Chưa phân loại'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày tạo:</span>
              <span className="font-mono text-foreground">
                {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount" className="text-xs font-semibold text-muted-foreground">
              Số tiền mới (VND)
            </Label>
            <Input
              id="edit-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleChangeAmount(e.target.value)}
              placeholder="0"
              className="rounded-lg h-10 text-sm border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary font-semibold text-right pr-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          {/* Nút Gỡ khỏi cột chỉ hiện khi giao dịch này được gán visually (thủ công) vào cột */}
          {isAssignedVisually && (
            <Button
              variant="ghost"
              type="button"
              onClick={handleRemoveFromColumn}
              className="mr-auto text-xs text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg h-9 px-3 cursor-pointer"
              disabled={isSubmitting}
            >
              <Trash2Icon className="size-3.5 mr-1" />
              Gỡ khỏi cột
            </Button>
          )}

          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 h-9 text-xs font-medium border-muted-foreground/20 hover:bg-accent cursor-pointer"
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-lg px-4 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component con: Dialog hiển thị danh sách giao dịch của cột ───
interface ColumnTransactionsDialogProps {
  column: ReportColumn | null;
  transactions: (TransactionWithCategory | ReportDummyTransaction)[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTransaction: (tx: TransactionWithCategory) => void;
  onUnassignTransaction?: (transactionId: string) => void;
  onUpdateColumn?: (updatedColumn: ReportColumn) => void;
}

function ColumnTransactionsDialog({
  column,
  transactions,
  open,
  onOpenChange,
  onEditTransaction,
  onUnassignTransaction,
  onUpdateColumn,
}: ColumnTransactionsDialogProps) {
  const [showDummyForm, setShowDummyForm] = useState(false);
  const [dummyNote, setDummyNote] = useState('');
  const [dummyAmount, setDummyAmount] = useState('');
  const [editingDummyId, setEditingDummyId] = useState<string | null>(null);


  if (!column) return null;

  const totalAmount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const handleSaveDummy = () => {
    if (column.kind !== 'category') return;

    const parsed = parseAmount(dummyAmount);
    if (!parsed || parsed <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    if (parsed > 9999999999999) {
      toast.error('Số tiền quá lớn (tối đa 9,999,999,999,999đ)');
      return;
    }

    if (editingDummyId) {
      // Edit
      const updatedDummies = (column.dummyTransactions ?? []).map((d) =>
        d.id === editingDummyId
          ? {
              ...d,
              note: dummyNote.trim() || 'Giao dịch giả lập',
              amount: parsed,
            }
          : d
      );
      const updatedCol: ReportColumn = {
        ...column,
        dummyTransactions: updatedDummies,
      };
      onUpdateColumn?.(updatedCol);
      toast.success('Đã cập nhật giao dịch giả lập');
    } else {
      // Add new
      const newDummy: ReportDummyTransaction = {
        id: crypto.randomUUID(),
        note: dummyNote.trim() || 'Giao dịch giả lập',
        amount: parsed,
        type: column.categoryType,
        created_at: new Date().toISOString(),
      };
      const updatedCol: ReportColumn = {
        ...column,
        dummyTransactions: [...(column.dummyTransactions ?? []), newDummy],
      };
      onUpdateColumn?.(updatedCol);
      toast.success('Đã thêm giao dịch giả lập');
    }

    // Reset
    setDummyNote('');
    setDummyAmount('');
    setEditingDummyId(null);
    setShowDummyForm(false);
  };

  const handleDeleteDummy = (dummyId: string) => {
    if (column.kind !== 'category') return;

    const updatedDummies = (column.dummyTransactions ?? []).filter((d) => d.id !== dummyId);
    const updatedCol: ReportColumn = {
      ...column,
      dummyTransactions: updatedDummies,
    };
    onUpdateColumn?.(updatedCol);
    toast.success('Đã xóa giao dịch giả lập');

    // Nếu đang edit chính dummy này thì reset form
    if (editingDummyId === dummyId) {
      setDummyNote('');
      setDummyAmount('');
      setEditingDummyId(null);
      setShowDummyForm(false);
    }
  };

  const handleEditDummyClick = (tx: ReportDummyTransaction) => {
    setDummyNote(tx.note);
    setDummyAmount(formatAmountInput(String(tx.amount)));
    setEditingDummyId(tx.id);
    setShowDummyForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border border-border/80 bg-card p-6 shadow-xl focus-visible:outline-none flex flex-col max-h-[85vh]">
        <DialogHeader className="space-y-1 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary">
              <IconPreview name={column.kind === 'category' ? column.categoryIcon : 'Package'} className="size-4.5" />
            </span>
            Giao dịch cột: {column.displayName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Danh sách giao dịch thuộc cột này trong tháng được lọc.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Thống kê nhanh và Nút Toggle thêm dummy */}
          <div className="flex items-center justify-between rounded-xl bg-muted/20 p-3 text-xs shrink-0 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground font-medium">Tổng cộng ({transactions.length} giao dịch):</span>
              <span className={cn(
                "font-bold text-sm tabular-nums",
                column.kind === 'category' && column.categoryType === 'income' ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {formatVnd(totalAmount)}
              </span>
            </div>
            
            {column.kind === 'category' && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-lg text-[11px] h-8 px-2.5 font-semibold transition-all cursor-pointer",
                  showDummyForm 
                    ? "bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 border-purple-500/20" 
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  if (showDummyForm) {
                    setDummyNote('');
                    setDummyAmount('');
                    setEditingDummyId(null);
                  }
                  setShowDummyForm(!showDummyForm);
                }}
              >
                <PlusIcon className="size-3 mr-1" />
                {showDummyForm ? 'Đóng form' : 'Giao dịch giả'}
              </Button>
            )}
          </div>

          {/* Form thêm/sửa giao dịch giả lập */}
          {column.kind === 'category' && showDummyForm && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 space-y-3 shrink-0 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-purple-500/10 pb-1.5">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {editingDummyId ? 'Sửa giao dịch giả lập' : 'Tự tạo giao dịch giả lập'}
                </span>
                <span className="text-[10px] text-muted-foreground/80 leading-none">
                  (Chỉ hiển thị tại báo cáo này)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dummy-note" className="text-[10px] font-semibold text-muted-foreground">
                    Ghi chú
                  </Label>
                  <Input
                    id="dummy-note"
                    value={dummyNote}
                    onChange={(e) => setDummyNote(e.target.value)}
                    placeholder="Ví dụ: Lương ngoài giờ, Ăn tối giả..."
                    className="h-8 text-xs rounded-lg border-purple-500/10 focus-visible:ring-purple-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dummy-amount" className="text-[10px] font-semibold text-muted-foreground">
                    Số tiền (VND)
                  </Label>
                  <Input
                    id="dummy-amount"
                    value={dummyAmount}
                    onChange={(e) => setDummyAmount(formatAmountInput(e.target.value))}
                    placeholder="0"
                    className="h-8 text-xs rounded-lg border-purple-500/10 focus-visible:ring-purple-500 font-semibold text-right pr-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDummy();
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDummyNote('');
                    setDummyAmount('');
                    setEditingDummyId(null);
                    setShowDummyForm(false);
                  }}
                  className="h-7 text-[10px] font-medium text-muted-foreground rounded-md hover:bg-muted cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveDummy}
                  className="h-7 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-md cursor-pointer shadow-sm transition-colors"
                >
                  {editingDummyId ? 'Cập nhật' : 'Thêm vào báo cáo'}
                </Button>
              </div>
            </div>
          )}

          {/* Danh sách giao dịch */}
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground flex-1 flex items-center justify-center">
              Không có giao dịch nào trong cột này
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 border rounded-xl divide-y divide-border/60 bg-muted/5 pr-1">
              {transactions.map((tx) => {
                const isDummy = !('account_id' in tx);
                const isVisually = !isDummy && column.kind === 'category' && (column.transactionIds ?? []).includes(tx.id);
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground truncate block max-w-[200px]" title={tx.note || 'Không có ghi chú'}>
                          {tx.note || 'Không có ghi chú'}
                        </span>
                        {isDummy ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-none hover:bg-purple-500/15 font-semibold">
                            Giả lập
                          </Badge>
                        ) : isVisually ? (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-none hover:bg-blue-500/15">
                            Gán thủ công
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground border-none hover:bg-muted/80">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(tx.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn(
                        "text-xs font-semibold tabular-nums",
                        tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'
                      )}>
                        {formatVnd(Number(tx.amount))}
                      </span>

                      <div className="flex items-center gap-1">
                        {isDummy ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                              onClick={() => handleEditDummyClick(tx as ReportDummyTransaction)}
                              title="Sửa giao dịch giả"
                            >
                              <PencilIcon className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteDummy(tx.id)}
                              title="Xóa giao dịch giả"
                            >
                              <Trash2Icon className="size-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer"
                              onClick={() => onEditTransaction(tx as TransactionWithCategory)}
                              title="Sửa số tiền"
                            >
                              <PencilIcon className="size-3" />
                            </Button>
                            {isVisually && onUnassignTransaction && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                onClick={() => onUnassignTransaction(tx.id)}
                                title="Gỡ khỏi cột"
                              >
                                <XIcon className="size-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 h-9 text-xs font-medium border-muted-foreground/20 hover:bg-accent cursor-pointer"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
