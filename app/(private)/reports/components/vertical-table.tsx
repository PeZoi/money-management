'use client';

import {
  CalendarIcon,
  EyeIcon,
  HashIcon,
  MoreVerticalIcon,
  PencilIcon,
  ScaleIcon,
  Sigma,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReportColumn, ReportTable } from '@/types/report';
import IconPreview from '@/components/icons/icon-preview';

import { decompileFormula, indexToLabel } from '../lib/formula-engine';
import {
  formatVnd,
  getColumnValueColorClass,
  getSystemMetricIconClass,
} from '../lib/report-helpers';
import type { ColumnTotalsMap } from '../hooks/use-report-table-data';

// ─── Bảng dạng dọc (Vertical) ────────────────────────

interface VerticalTableProps {
  table: ReportTable;
  columns: ReportColumn[];
  dataColumns: ReportColumn[];
  columnTotals: ColumnTotalsMap;
  // Column drag-drop
  onColDragStart: (colId: string, e: React.DragEvent) => void;
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
  // Cell click → xem giao dịch
  onCellClick: (col: ReportColumn) => void;
  readOnly?: boolean;
}

export function VerticalTable({
  table,
  columns,
  dataColumns,
  columnTotals,
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
  onCellClick,
  readOnly = false,
}: VerticalTableProps) {
  // Tính tổng thực thu/chi (tổng của các dòng category với multiplier tương ứng)
  const grandTotal = useMemo(() => {
    return Array.from(columnTotals.entries())
      .filter(([colId]) => {
        const col = columns.find((c) => c.id === colId);
        return col?.kind === 'category';
      })
      .reduce((sum, [colId, val]) => {
        const col = columns.find((c) => c.id === colId);
        const multiplier = col && col.kind === 'category' && col.categoryType === 'expense' ? -1 : 1;
        return sum + val * multiplier;
      }, 0);
  }, [columnTotals, columns]);

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-12 whitespace-nowrap border-r border-border/60">
              STT
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-r border-border/60 min-w-[160px]">
              Hạng mục (Hàng)
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 w-40 whitespace-nowrap">
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
                draggable={!readOnly}
                onDragStart={!readOnly ? (e) => {
                  e.stopPropagation();
                  onColDragStart(col.id, e);
                } : undefined}
                onDragOver={!readOnly ? (e) => {
                  onColDragOver(e, col.id);
                  onColDragOverTx(e, col);
                } : undefined}
                onDragLeave={!readOnly ? onColDragLeaveTx : undefined}
                onDrop={!readOnly ? (e) => onColDropTx(e, col) : undefined}
                onDragEnd={!readOnly ? onColDragEnd : undefined}
                className={cn(
                  'border-b border-border/60 last:border-b-0 transition-all duration-200 relative',
                  col.kind === 'formula' && 'bg-amber-500/3 hover:bg-amber-500/6 dark:bg-amber-500/6 dark:hover:bg-amber-500/1',
                  col.kind === 'system' && 'bg-blue-500/2 hover:bg-blue-500/4 dark:bg-blue-500/4 dark:hover:bg-blue-500/8',
                  col.kind === 'category' && 'hover:bg-muted/15',
                  !readOnly && 'cursor-grab active:cursor-grabbing group/row',
                  !readOnly && activeDragOverColId === col.id && 'bg-primary/10 border-t-primary/70 scale-[1.01] shadow-sm',
                )}
              >
                {/* Cột STT */}
                <td className="px-3 py-3.5 text-center text-xs text-muted-foreground/50 w-12 border-r border-border/60">
                  {index + 1}
                </td>

                {/* Cột Tên hạng mục */}
                <td className="px-4 py-3.5 border-r border-border/60 min-w-[160px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {label && (
                        <span className={cn(
                          "inline-flex items-center justify-center size-5.5 rounded-full text-[10px] font-bold shrink-0",
                          col.kind === 'formula' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          col.kind === 'system' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          col.kind === 'category' && "bg-primary/10 text-primary"
                        )}>
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
                          {col.systemMetric === 'avg_daily_expense' && <CalendarIcon className="size-3" />}
                          {col.systemMetric === 'transaction_count' && <HashIcon className="size-3" />}
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
                          className="h-5 w-32 text-xs rounded px-1 font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : readOnly ? (
                        <div className="flex items-center gap-1 select-none">
                          <span className="text-xs font-semibold truncate text-foreground">
                            {col.displayName.replace(/\s*\(Chỉ số\)/gi, '')}
                          </span>
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
                              className="flex items-center gap-1.5 cursor-pointer group/trigger select-none"
                            >
                              <span
                                className="text-xs font-semibold truncate hover:text-primary transition-colors"
                                title="Nhấp 1 lần để mở menu, nhấp đúp để đổi tên"
                              >
                                {col.displayName.replace(/\s*\(Chỉ số\)/gi, '')}
                              </span>
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
                        <span className="text-[9px] font-mono font-medium text-amber-700 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20 px-1.5 py-0.5 rounded-md ml-2 shrink-0">
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
                      onCellClick(col);
                    }
                  }}
                  className={cn(
                    'px-4 py-3.5 text-right font-mono text-[13px] tracking-tight font-bold w-40',
                    col.kind === 'category' && 'cursor-pointer hover:bg-primary/5 hover:text-primary transition-colors',
                    !readOnly && col.kind === 'category' && 'underline decoration-dotted decoration-muted-foreground/30 underline-offset-4',
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
            <tr className={cn(
              "border-y-2 transition-colors duration-200",
              grandTotal < 0
                ? "border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/25"
                : "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/25"
            )}>
              <td className={cn(
                "px-3 py-4 text-center text-sm font-extrabold border-r transition-colors duration-200",
                grandTotal < 0
                  ? "text-rose-700 dark:text-rose-300 border-rose-500/20"
                  : "text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              )}>
                Σ
              </td>
              <td className={cn(
                "px-4 py-4 text-left text-xs font-bold border-r transition-colors duration-200",
                grandTotal < 0
                  ? "text-rose-700 dark:text-rose-300 border-rose-500/20"
                  : "text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              )}>
                Tổng thực thu/chi (chỉ cộng các dòng danh mục)
              </td>
              <td className={cn(
                "px-4 py-4 text-right font-mono text-sm font-extrabold w-40 transition-colors duration-200",
                grandTotal < 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300"
              )}>
                {formatVnd(grandTotal)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
