'use client';

import {
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  ScaleIcon,
  Sigma,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  ReportColumn,
  ReportTable,
} from '@/types/report';
import type { TransactionWithCategory } from '@/types/database';
import IconPreview from '@/components/icons/icon-preview';

import { decompileFormula, evaluateFormula, indexToLabel } from '../lib/formula-engine';
import {
  formatVnd,
  getColumnValueColorClass,
  getSystemMetricIconClass,
} from '../lib/report-helpers';
import type { ColumnTotalsMap, ColumnTransactionsMap } from '../hooks/use-report-table-data';

// ─── Bảng dạng ngang (Horizontal) ─────────────────────

interface HorizontalTableProps {
  table: ReportTable;
  columns: ReportColumn[];
  dataColumns: ReportColumn[];
  columnTransactions: ColumnTransactionsMap;
  columnTotals: ColumnTotalsMap;
  maxRows: number;
  // Column drag-drop
  onColDragStart: (colId: string) => void;
  onColDragOver: (e: React.DragEvent, targetColId: string) => void;
  onColDragEnd: () => void;
  // Transaction drag-drop vào cột
  activeDragOverColId: string | null;
  onColDragOverTx: (e: React.DragEvent, col: ReportColumn) => void;
  onColDragLeaveTx: () => void;
  onColDropTx: (e: React.DragEvent, col: ReportColumn) => void;
  // Column actions
  onDeleteColumn: (tableId: string, columnId: string) => void;
  onRenameColumn: (tableId: string, columnId: string, newName: string) => void;
  onOpenFormulaDialog: (tableId: string, editColumn?: ReportColumn) => void;
  onUpdateColumn?: (tableId: string, columnId: string, updatedColumn: ReportColumn) => void;
  // Cell click
  onCellClick: (col: ReportColumn) => void;
  onTxCellClick: (tx: TransactionWithCategory, col: ReportColumn) => void;
  onDummyCellClick: (col: ReportColumn) => void;
  readOnly?: boolean;
}

export function HorizontalTable({
  table,
  columns,
  dataColumns,
  columnTransactions,
  columnTotals,
  maxRows,
  onColDragStart,
  onColDragOver,
  onColDragEnd,
  activeDragOverColId,
  onColDragOverTx,
  onColDragLeaveTx,
  onColDropTx,
  onDeleteColumn,
  onRenameColumn,
  onOpenFormulaDialog,
  onUpdateColumn,
  onCellClick,
  onTxCellClick,
  onDummyCellClick,
  readOnly = false,
}: HorizontalTableProps) {
  // ─── Đổi tên cột (inline edit) ────────────────────
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editColumnName, setEditColumnName] = useState('');
  const colNameInputRef = useRef<HTMLInputElement>(null);
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleHeaderClick = (col: ReportColumn) => {
    if (editingColumnId === col.id) return;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      setActiveMenuColId(null);
      startEditColumn(col);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        if (editingColumnId !== col.id) {
          setActiveMenuColId(col.id);
        }
      }, 250);
    }
  };

  // ─── Resize cột ───────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const thElement = (e.target as HTMLElement).closest('th');
    if (!thElement) return;
    const startWidth = thElement.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      thElement.style.width = `${newWidth}px`;
      thElement.style.minWidth = `${newWidth}px`;
      thElement.style.maxWidth = `${newWidth}px`;

      const colIndex = Array.from(thElement.parentNode?.children || []).indexOf(thElement);
      const tableEl = thElement.closest('table');
      if (tableEl) {
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        {/* Header cột */}
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            {/* Cột STT */}
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-12 whitespace-nowrap border-r border-border/60">
              STT
            </th>
            {columns.map((col) => {
              const catIdx = dataColumns.findIndex((c) => c.id === col.id);
              const label = (col.kind === 'category' || col.kind === 'system') && catIdx >= 0
                ? indexToLabel(catIdx)
                : null;

              return (
                <th
                  key={col.id}
                  draggable={!readOnly}
                  onDragStart={!readOnly ? (e) => {
                    e.stopPropagation();
                    onColDragStart(col.id);
                  } : undefined}
                  onDragOver={!readOnly ? (e) => {
                    onColDragOver(e, col.id);
                    onColDragOverTx(e, col);
                  } : undefined}
                  onDragLeave={!readOnly ? onColDragLeaveTx : undefined}
                  onDrop={!readOnly ? (e) => onColDropTx(e, col) : undefined}
                  onDragEnd={!readOnly ? onColDragEnd : undefined}
                  className={cn(
                    'px-4 py-3 text-right whitespace-nowrap group/col transition-all relative border-t-2 border-t-transparent border-r last:border-r-0 border-r-border/20',
                    !readOnly && 'cursor-grab active:cursor-grabbing',
                    col.kind === 'formula' && 'bg-amber-500/2',
                    col.kind === 'system' && 'bg-blue-500/2',
                    !readOnly && activeDragOverColId === col.id && 'bg-primary/10 border-t-primary/70 scale-[1.02] shadow-sm',
                  )}
                  style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      {label && (
                        <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                          {label}
                        </span>
                      )}
                      {col.kind === 'formula' && (
                        <span className="inline-flex items-center justify-center size-5 rounded-md bg-amber-500/10 text-amber-600 shrink-0">
                          <Sigma className="size-3" />
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
                        <IconPreview
                          name={col.categoryIcon}
                          className={cn(
                            "size-4 shrink-0",
                            col.categoryType === 'income' ? 'text-emerald-500' : 'text-rose-500'
                          )}
                        />
                      )}

                      {editingColumnId === col.id && !readOnly ? (
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
                      ) : readOnly ? (
                        <div className="flex items-center gap-1 select-none">
                          <span className="text-xs font-semibold truncate text-foreground">
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
                        </div>
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
                                    'px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 scale-90 border',
                                    col.categoryType === 'expense'
                                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                                  )}
                                >
                                  {col.categoryType === 'expense' ? 'Chi' : 'Thu'}
                                </span>
                              )}
                              {col.kind === 'system' && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[8px] font-bold uppercase tracking-wider shrink-0 scale-90">
                                  Hệ thống
                                </span>
                              )}

                              <MoreVerticalIcon className="size-3.5 text-muted-foreground/40 group-hover/trigger:text-muted-foreground transition-colors shrink-0" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48">
                            {col.kind === 'category' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCellClick(col);
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

                  {col.kind === 'formula' && (
                    <span className="mt-1 block text-[9px] font-medium text-amber-600/60 truncate max-w-[120px] tracking-tight">
                      = {decompileFormula(col.formula, columns)}
                    </span>
                  )}
                  {/* Resizer */}
                  {!readOnly && (
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.id)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/60 active:bg-primary z-10 opacity-0 group-hover/col:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    />
                  )}
                </th>
              );
            })}

            {/* Cột tổng */}
            {table.showTotals !== false && (
              <th className="px-4 py-3.5 text-right whitespace-nowrap bg-emerald-500/10 dark:bg-emerald-500/20 min-w-[120px] border-l border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tổng</span>
              </th>
            )}
            {/* Cột Spacer */}
            <th className="p-0 border-none bg-transparent w-auto"></th>
          </tr>
        </thead>

        {/* Dữ liệu */}
        <tbody>
          {Array.from({ length: maxRows }, (_, rowIdx) => {
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
                className="border-b last:border-b-0 hover:bg-muted/15 transition-colors"
              >
                <td className="px-3 py-2.5 text-center text-xs text-muted-foreground/50 border-r border-border/60">
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
                        if (readOnly) {
                          if (col.kind === 'category') {
                            onCellClick(col);
                          }
                        } else if (tx) {
                          const isDummy = !('account_id' in tx);
                          if (isDummy) {
                            onDummyCellClick(col);
                          } else {
                            onTxCellClick(tx as TransactionWithCategory, col);
                          }
                        }
                      }}
                      style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                      className={cn(
                        'px-4 py-3 text-right font-mono text-[13px] tracking-tight border-r last:border-r-0 border-border/60',
                        col.kind === 'formula' && 'bg-amber-500/1',
                        col.kind === 'system' && 'bg-blue-500/1',
                        tx && !readOnly && 'cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors underline decoration-dotted decoration-muted-foreground/30 underline-offset-4',
                        col.kind === 'category' && readOnly && 'cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors',
                        getColumnValueColorClass(col, val)
                      )}
                      title={readOnly && col.kind === 'category' ? 'Nhấp để xem danh sách giao dịch' : (tx ? `Nhấp để sửa giá trị giao dịch: ${tx.note || 'Không có ghi chú'}` : undefined)}
                    >
                      {col.kind === 'system' ? (rowIdx === 0 ? formatVnd(columnTotals.get(col.id) ?? 0) : '—') : formatVnd(val)}
                    </td>
                  );
                })}
                {table.showTotals !== false && (
                  <td className={cn(
                    "px-4 py-3 text-right font-mono text-[13px] tracking-tight font-bold bg-emerald-500/10 dark:bg-emerald-500/20 border-l border-emerald-500/20",
                    rowTotal < 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                  )}>
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
            <tr className="border-y-2 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/25">
              <td className="px-3 py-3.5 text-center text-sm font-extrabold text-emerald-700 dark:text-emerald-300 border-r border-emerald-500/20">
                Σ
              </td>
              {columns.map((col) => {
                const total = columnTotals.get(col.id) ?? 0;
                return (
                  <td
                    key={col.id}
                    style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { minWidth: '130px' }}
                    className={cn(
                      'px-4 py-3.5 text-right font-mono text-[13px] tracking-tight font-bold border-r last:border-r-0 border-border/60',
                      col.kind === 'formula'
                        ? 'text-amber-700 dark:text-amber-400'
                        : col.kind === 'system'
                          ? 'text-blue-700 dark:text-blue-400'
                          : col.kind === 'category'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-foreground',
                    )}
                  >
                    {formatVnd(total)}
                  </td>
                );
              })}
              <td className="px-4 py-3.5 text-right font-mono text-sm font-extrabold text-emerald-700 dark:text-emerald-300 border-l border-emerald-500/20">
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
  );
}
