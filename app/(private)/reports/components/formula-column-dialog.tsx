'use client';

import {
  CalculatorIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  ReportColumn,
} from '@/types/report';
import IconPreview from '@/components/icons/icon-preview';
import { cn } from '@/lib/utils';

import {
  compileFormula,
  decompileFormula,
  indexToLabel,
} from '../lib/formula-engine';

// ─── Props ───────────────────────────────────────────

interface FormulaColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ReportColumn[]; // Tất cả cột hiện tại trong bảng
  editColumn: ReportColumn | null; // Null = tạo mới, có giá trị = sửa
  onSave: (column: ReportColumn) => void;
}

export function FormulaColumnDialog({
  open,
  onOpenChange,
  columns,
  editColumn,
  onSave,
}: FormulaColumnDialogProps) {
  const [name, setName] = useState(() => editColumn ? editColumn.displayName : '');
  const [formulaDisplay, setFormulaDisplay] = useState(() => {
    if (editColumn && editColumn.kind === 'formula') {
      return decompileFormula(editColumn.formula, columns);
    }
    return '';
  });
  const [customColType, setCustomColType] = useState<'expense' | 'income'>(() => {
    if (editColumn && editColumn.kind === 'category') {
      return editColumn.categoryType;
    }
    return 'expense';
  });
  const [columnKind, setColumnKind] = useState<'data' | 'system'>(() => {
    if (editColumn && editColumn.kind === 'system') {
      return 'system';
    }
    return 'data';
  });
  const [systemMetric, setSystemMetric] = useState<'month_balance' | 'account_balance' | 'total_expense' | 'total_income'>(() => {
    if (editColumn && editColumn.kind === 'system') {
      return editColumn.systemMetric;
    }
    return 'month_balance';
  });
  const [error, setError] = useState('');

  const getDefaultMetricName = (metric: string) => {
    switch (metric) {
      case 'month_balance': return 'Số dư trong tháng';
      case 'account_balance': return 'Số dư tài khoản';
      case 'total_expense': return 'Tổng tiền chi';
      case 'total_income': return 'Tổng tiền thu nhập';
      default: return '';
    }
  };

  // Chèn nhanh nhãn cột vào cuối công thức và thêm khoảng trắng
  const insertLabel = (label: string) => {
    setFormulaDisplay((prev) => {
      const hasSpace = prev.length === 0 || prev.endsWith(' ');
      return `${prev}${hasSpace ? '' : ' '}${label} `;
    });
    setError('');
  };

  // Danh sách cột dữ liệu/hệ thống có thể tham chiếu trong công thức
  const referenceColumns = columns.filter((c) => c.kind === 'category' || c.kind === 'system');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Tên không được để trống');
      return;
    }

    let column: ReportColumn;

    if (columnKind === 'system') {
      column = {
        id: editColumn && editColumn.kind === 'system' ? editColumn.id : crypto.randomUUID(),
        kind: 'system',
        systemMetric: systemMetric,
        displayName: name.trim(),
      };
    } else {
      const hasFormula = formulaDisplay.trim().length > 0;
      if (hasFormula) {
        // 1. Tạo hoặc cập nhật cột công thức
        const compiledFormula = compileFormula(formulaDisplay, columns);
        column = {
          id: editColumn && editColumn.kind === 'formula' ? editColumn.id : crypto.randomUUID(),
          kind: 'formula',
          displayName: name.trim(),
          formula: compiledFormula,
        };
      } else {
        // 2. Tạo hoặc cập nhật cột trống (visually category) gán giao dịch thủ công
        const customColId = editColumn ? editColumn.id : crypto.randomUUID();
        column = {
          id: customColId,
          kind: 'category',
          categoryId: `custom-${customColId}`, // ID giả lập phân biệt với DB danh mục
          categoryName: name.trim(),
          categoryIcon: 'Package', // Icon mặc định cho cột tùy chỉnh
          categoryType: customColType,
          displayName: name.trim(),
          transactionIds: editColumn && editColumn.kind === 'category' ? (editColumn.transactionIds ?? []) : [],
          dummyTransactions: editColumn && editColumn.kind === 'category' ? (editColumn.dummyTransactions ?? []) : [],
        };
      }
    }

    onSave(column);
  };

  const systemMetricsList = [
    { id: 'month_balance', label: 'Số dư trong tháng', icon: ScaleIcon, color: 'text-amber-600 bg-amber-500/10' },
    { id: 'account_balance', label: 'Số dư tài khoản', icon: WalletIcon, color: 'text-blue-600 bg-blue-500/10' },
    { id: 'total_income', label: 'Tổng tiền thu nhập', icon: TrendingUpIcon, color: 'text-emerald-600 bg-emerald-500/10' },
    { id: 'total_expense', label: 'Tổng tiền chi', icon: TrendingDownIcon, color: 'text-rose-600 bg-rose-500/10' },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-xl focus-visible:outline-none">
        <DialogHeader className="space-y-1 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="inline-flex items-center justify-center size-8 rounded-xl bg-amber-500/10 text-amber-600">
              <CalculatorIcon className="size-4.5" />
            </span>
            {editColumn ? 'Sửa hạng mục cấu hình' : 'Thêm hạng mục cấu hình'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Tạo cột trống (kéo thả giao dịch), nhập công thức hoặc hiển thị chỉ số tài chính của hệ thống.
          </DialogDescription>

          {/* Tab selector */}
          <div className="flex border-b text-xs font-semibold text-muted-foreground mt-4 pt-2">
            <button
              type="button"
              onClick={() => setColumnKind('data')}
              className={cn(
                "flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer",
                columnKind === 'data' ? "border-primary text-primary font-bold" : "border-transparent hover:text-foreground"
              )}
              disabled={!!editColumn} // Khi sửa không cho phép đổi loại
            >
              Dữ liệu & Công thức
            </button>
            <button
              type="button"
              onClick={() => setColumnKind('system')}
              className={cn(
                "flex-1 pb-2 border-b-2 text-center transition-all cursor-pointer",
                columnKind === 'system' ? "border-primary text-primary font-bold" : "border-transparent hover:text-foreground"
              )}
              disabled={!!editColumn}
            >
              Chỉ số hệ thống
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {columnKind === 'data' ? (
            <>
              {/* Tên cột */}
              <div className="space-y-2">
                <Label htmlFor="formula-name" className="text-xs font-semibold text-foreground">
                  Tên cột/dòng
                </Label>
                <Input
                  id="formula-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Còn dư, Tiết kiệm, Quỹ đen..."
                  className="rounded-lg h-9 text-xs border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Bảng tham chiếu hoặc thông báo trống */}
              <div className="space-y-2">
                {referenceColumns.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-foreground">
                        Hạng mục tham chiếu (Nhấp để chèn)
                      </Label>
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        Chọn nhanh
                      </span>
                    </div>
                    <div className="rounded-xl border bg-muted/20 p-2 max-h-[130px] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {referenceColumns.map((col, idx) => {
                          const label = indexToLabel(idx);
                          return (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => insertLabel(label)}
                              className="flex items-center gap-2 text-xs bg-background hover:bg-accent border border-muted-foreground/10 hover:border-primary/30 rounded-lg p-2 transition-all text-left min-w-0 shadow-sm active:scale-[0.98] group/ref cursor-pointer"
                              title={`Chèn ${label} vào công thức`}
                            >
                              <span className="inline-flex items-center justify-center size-5 rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0 group-hover/ref:bg-primary group-hover/ref:text-primary-foreground transition-colors">
                                {label}
                              </span>
                              {col.kind === 'category' ? (
                                <IconPreview name={col.categoryIcon} className="size-3.5 shrink-0 text-muted-foreground group-hover/ref:text-foreground transition-colors" />
                              ) : col.kind === 'system' ? (
                                <span className="inline-flex items-center justify-center size-4 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                  {col.systemMetric === 'account_balance' && <WalletIcon className="size-2.5" />}
                                  {col.systemMetric === 'month_balance' && <ScaleIcon className="size-2.5" />}
                                  {col.systemMetric === 'total_income' && <TrendingUpIcon className="size-2.5" />}
                                  {col.systemMetric === 'total_expense' && <TrendingDownIcon className="size-2.5" />}
                                </span>
                              ) : null}
                              <span className="truncate text-muted-foreground group-hover/ref:text-foreground font-semibold flex-1 min-w-0">
                                {col.displayName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 p-3 text-center">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Chưa có hạng mục dữ liệu để lập công thức
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1 max-w-[320px] mx-auto leading-relaxed">
                      Thêm các hạng mục danh mục hoặc chỉ số hệ thống trước để làm tham chiếu cho công thức.
                    </p>
                  </div>
                )}
              </div>

              {/* Công thức */}
              <div className="space-y-2">
                <Label htmlFor="formula-expr" className="text-xs font-semibold text-foreground">
                  Công thức tính toán (Bỏ trống nếu muốn tạo dòng/cột kéo thả)
                </Label>
                <Input
                  id="formula-expr"
                  value={formulaDisplay}
                  onChange={(e) => {
                    setFormulaDisplay(e.target.value);
                    setError('');
                  }}
                  placeholder="Ví dụ: (A + B) - C"
                  className="rounded-lg h-9 text-xs font-mono border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                  }}
                />
                <p className="text-[10px] text-muted-foreground/70 leading-normal">
                  Ví dụ: <code className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">(A + B) * 2 - C</code>. Bỏ trống để tạo một cột dữ liệu mới.
                </p>
              </div>

              {/* Loại cột (Chỉ hiển thị khi công thức trống) */}
              {!formulaDisplay.trim() && (
                <div className="space-y-2 animate-fade-in duration-200">
                  <Label className="text-xs font-semibold text-foreground">
                    Loại dữ liệu
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomColType('expense')}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                        customColType === 'expense'
                          ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/10'
                          : 'bg-background hover:bg-accent border-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      Chi tiêu (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomColType('income')}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                        customColType === 'income'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/10'
                          : 'bg-background hover:bg-accent border-muted-foreground/20 text-muted-foreground'
                      )}
                    >
                      Thu nhập (Income)
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 leading-normal">
                    Chỉ cho phép kéo thả các giao dịch có loại thu/chi tương ứng vào cột/dòng này.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Chỉ số hệ thống */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Chọn chỉ số hệ thống muốn hiển thị
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {systemMetricsList.map((item) => {
                    const Icon = item.icon;
                    const isSelected = systemMetric === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSystemMetric(item.id);
                          setName(getDefaultMetricName(item.id));
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/10 shadow-sm"
                            : "border-muted-foreground/10 hover:border-muted-foreground/30 bg-background"
                        )}
                      >
                        <span className={cn("inline-flex items-center justify-center size-8 rounded-lg shrink-0", item.color)}>
                          <Icon className="size-4" />
                        </span>
                        <span className="text-xs font-semibold text-foreground leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tên hiển thị của chỉ số */}
              <div className="space-y-2 pt-2 animate-fade-in">
                <Label htmlFor="metric-name" className="text-xs font-semibold text-foreground">
                  Tên hiển thị (Tự chỉnh sửa theo ý muốn)
                </Label>
                <Input
                  id="metric-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên hiển thị..."
                  className="rounded-lg h-9 text-xs border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/5 border border-destructive/10 rounded-lg px-2.5 py-1.5 animate-pulse">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t mt-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg px-4 h-9 text-xs font-medium border-muted-foreground/20 hover:bg-accent cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-lg px-4 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-sm"
          >
            {editColumn ? 'Cập nhật' : 'Thêm hạng mục'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
