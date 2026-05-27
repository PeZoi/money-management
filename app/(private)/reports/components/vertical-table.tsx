'use client';

import {
  CalculatorIcon,
  EyeIcon,
  MoreVerticalIcon,
  PencilIcon,
  ScaleIcon,
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
  // Cell click → xem giao dịch
  onCellClick: (col: ReportColumn) => void;
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
}: VerticalTableProps) {
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
                  onColDragStart(col.id);
                }}
                onDragOver={(e) => {
                  onColDragOver(e, col.id);
                  onColDragOverTx(e, col);
                }}
                onDragLeave={onColDragLeaveTx}
                onDrop={(e) => onColDropTx(e, col)}
                onDragEnd={onColDragEnd}
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
                      onCellClick(col);
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
  );
}
