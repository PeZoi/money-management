'use client';

import {
  PlusIcon,
  Sigma,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TransactionWithCategory } from '@/types/database';
import { toast } from 'sonner';
import type {
  ReportColumn,
  ReportTable,
} from '@/types/report';
import type { CategoryUi } from '@/types/category';

import { useReportTableData } from '../hooks/use-report-table-data';
import { ReportTableHeader } from './report-table-header';
import { VerticalTable } from './vertical-table';
import { HorizontalTable } from './horizontal-table';
import { ColumnTransactionsDialog } from './column-transactions-dialog';
import { EditAmountDialog } from './edit-amount-dialog';

// ─── Props ───────────────────────────────────────────

interface ReportTableCardProps {
  table: ReportTable;
  transactions: TransactionWithCategory[];
  month: string;
  onRenameTable: (tableId: string, newName: string) => void;
  onDeleteTable: (tableId: string) => void;
  onDropCategory: (tableId: string, category: CategoryUi) => void;
  onDropSystemMetric?: (
    tableId: string,
    metricId: 'month_balance' | 'account_balance' | 'total_expense' | 'total_income',
    label: string,
  ) => void;
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
  readOnly?: boolean;
  overrideTotalAccountBalance?: number;
}

export function ReportTableCard({
  table,
  transactions,
  month,
  onRenameTable,
  onDeleteTable,
  onDropCategory,
  onDropSystemMetric,
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
  readOnly = false,
  overrideTotalAccountBalance,
}: ReportTableCardProps) {
  const { columns } = table;

  // ─── Hook tính toán dữ liệu bảng ──────────────────
  const { dataColumns, columnTransactions, maxRows, columnTotals } =
    useReportTableData({ table, transactions, month, overrideTotalAccountBalance });

  // ─── State UI ──────────────────────────────────────
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [editingColumnIdForTx, setEditingColumnIdForTx] = useState<string | null>(null);
  const [activeDragOverColId, setActiveDragOverColId] = useState<string | null>(null);
  const [selectedColumnForTransactions, setSelectedColumnForTransactions] = useState<ReportColumn | null>(null);

  // ─── Drop zone cho danh mục và chỉ số hệ thống ───────
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/report-category') ||
      e.dataTransfer.types.includes('application/report-system-metric')
    ) {
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

      // 1. Thả cột danh mục
      const rawCategory = e.dataTransfer.getData('application/report-category');
      if (rawCategory) {
        try {
          const category = JSON.parse(rawCategory) as CategoryUi;
          onDropCategory(table.id, category);
          return;
        } catch {
          // Bỏ qua
        }
      }

      // 2. Thả cột chỉ số hệ thống
      const rawMetric = e.dataTransfer.getData('application/report-system-metric');
      if (rawMetric && onDropSystemMetric) {
        try {
          const metric = JSON.parse(rawMetric) as {
            id: 'month_balance' | 'account_balance' | 'total_expense' | 'total_income';
            label: string;
          };
          onDropSystemMetric(table.id, metric.id, metric.label);
          toast.success(`Đã thêm chỉ số "${metric.label}" vào bảng`);
        } catch {
          // Bỏ qua
        }
      }
    },
    [onDropCategory, onDropSystemMetric, table.id],
  );

  // ─── Kéo thả sắp xếp cột ─────────────────────────
  const dragColId = useRef<string | null>(null);

  const handleColDragStart = (colId: string, e: React.DragEvent) => {
    dragColId.current = colId;
    e.dataTransfer.setData('application/report-column-id', colId);
    e.dataTransfer.setData('application/report-source-table-id', table.id);
    e.dataTransfer.effectAllowed = 'move';
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

  // ─── Kéo thả giao dịch vào cột ────────────────────
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

  const handleColDropTx = (e: React.DragEvent, col: ReportColumn) => {
    if (col.kind !== 'category') return;
    e.preventDefault();
    e.stopPropagation();
    setActiveDragOverColId(null);

    const raw = e.dataTransfer.getData('application/report-transaction');
    if (!raw) return;

    try {
      const transaction = JSON.parse(raw) as TransactionWithCategory;
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

  // ─── Render ────────────────────────────────────────

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden',
        !readOnly && isDragOver && 'ring-2 ring-primary/40 border-primary/30 shadow-xl shadow-primary/10 bg-primary/2',
      )}
      onDragOver={!readOnly ? handleDragOver : undefined}
      onDragLeave={!readOnly ? handleDragLeave : undefined}
      onDrop={!readOnly ? handleDrop : undefined}
    >
      {/* Header bảng */}
      <ReportTableHeader
        table={table}
        onRenameTable={onRenameTable}
        onDeleteTable={onDeleteTable}
        onOpenFormulaDialog={onOpenFormulaDialog}
        onUpdateTableLayout={onUpdateTableLayout}
        onUpdateTableShowTotals={onUpdateTableShowTotals}
        dragHandle={dragHandle}
        readOnly={readOnly}
      />

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
              <Sigma className="size-3 mr-1" />
              Thêm {table.layout === 'vertical' ? 'dòng' : 'cột'} công thức
            </Button>
          </div>
        </div>
      ) : table.layout === 'vertical' ? (
        <VerticalTable
          table={table}
          columns={columns}
          dataColumns={dataColumns}
          columnTotals={columnTotals}
          onColDragStart={handleColDragStart}
          onColDragOver={handleColDragOver}
          onColDragEnd={handleColDragEnd}
          activeDragOverColId={activeDragOverColId}
          onColDragOverTx={handleColDragOverTx}
          onColDragLeaveTx={handleColDragLeaveTx}
          onColDropTx={handleColDropTx}
          onDeleteColumn={onDeleteColumn}
          onRenameColumn={onRenameColumn}
          onOpenFormulaDialog={onOpenFormulaDialog}
          onCellClick={setSelectedColumnForTransactions}
          readOnly={readOnly}
        />
      ) : (
        <HorizontalTable
          table={table}
          columns={columns}
          dataColumns={dataColumns}
          columnTransactions={columnTransactions}
          columnTotals={columnTotals}
          maxRows={maxRows}
          onColDragStart={handleColDragStart}
          onColDragOver={handleColDragOver}
          onColDragEnd={handleColDragEnd}
          activeDragOverColId={activeDragOverColId}
          onColDragOverTx={handleColDragOverTx}
          onColDragLeaveTx={handleColDragLeaveTx}
          onColDropTx={handleColDropTx}
          onDeleteColumn={onDeleteColumn}
          onRenameColumn={onRenameColumn}
          onOpenFormulaDialog={onOpenFormulaDialog}
          onUpdateColumn={onUpdateColumn}
          onCellClick={setSelectedColumnForTransactions}
          onTxCellClick={(tx, col) => {
            setEditingTransaction(tx);
            setEditingColumnIdForTx(col.id);
          }}
          onDummyCellClick={setSelectedColumnForTransactions}
          readOnly={readOnly}
        />
      )}

      {/* Drop indicator khi kéo thả */}
      {isDragOver && !readOnly && columns.length > 0 && (
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
        readOnly={readOnly}
      />

      {/* Dialog chỉnh sửa số tiền giao dịch */}
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
