'use client';

import {
  BarChart3Icon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import type {
  ReportCategoryColumn,
  ReportColumn,
  ReportTable,
} from '@/types/report';
import type { CategoryUi } from '@/types/category';

import { useReportConfig } from '../hooks/use-report-config';
import { useReportTransactions } from '../hooks/use-report-transactions';
import { CategorySidebar } from './category-sidebar';
import { FormulaColumnDialog } from './formula-column-dialog';
import { ReportTableCard } from './report-table-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Trang báo cáo tuỳ biến chính.
 * Quản lý state tổng hợp: danh sách bảng, kéo thả, lưu cấu hình.
 */
export default function ReportsPageClient() {
  // ─── Month filter (mặc định tháng hiện tại) ───────
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ─── Data hooks ────────────────────────────────────
  const { categories, isLoading: catLoading } = useCategories();
  const { transactions, isLoading: txLoading } = useReportTransactions(month);
  const {
    tables: savedTables,
    isLoading: configLoading,
    isSuccess: configSuccess,
    isSaving,
    saveTablesDebounced,
    saveTablesImmediate,
  } = useReportConfig(month);

  // ─── Local state cho danh sách bảng ────────────────
  const [tables, setTables] = useState<ReportTable[]>([]);
  const tablesInitialized = useRef(false);

  // Reset flag khi đổi tháng để cho phép đồng bộ cấu hình của tháng mới
  useEffect(() => {
    tablesInitialized.current = false;
  }, [month]);

  // Sync từ server config khi load lần đầu hoặc khi đổi tháng
  useEffect(() => {
    if (configSuccess && savedTables && !tablesInitialized.current) {
      setTables(savedTables);
      tablesInitialized.current = true;
    }
  }, [savedTables, configSuccess]);

  // ─── Delete table confirm dialog state ─────────────
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmTableId, setDeleteConfirmTableId] = useState<string | null>(null);
  const [deleteConfirmTableName, setDeleteConfirmTableName] = useState<string | null>(null);

  // ─── Formula dialog state ──────────────────────────
  const [formulaDialogOpen, setFormulaDialogOpen] = useState(false);
  const [formulaTargetTableId, setFormulaTargetTableId] = useState<string | null>(null);
  const [formulaEditColumn, setFormulaEditColumn] = useState<ReportColumn | null>(null);

  // ─── Auto-save khi tables thay đổi ─────────────────
  const persistTables = useCallback(
    (updated: ReportTable[]) => {
      setTables(updated);
      saveTablesDebounced(updated);
    },
    [saveTablesDebounced],
  );

  // ─── Tạo bảng mới ─────────────────────────────────
  const handleCreateTable = () => {
    const newTable: ReportTable = {
      id: crypto.randomUUID(),
      name: `Bảng ${tables.length + 1}`,
      columns: [],
    };
    persistTables([...tables, newTable]);
  };

  // ─── Xóa bảng ─────────────────────────────────────
  const handleDeleteTable = (tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    if (table.columns.length > 0) {
      setDeleteConfirmTableId(tableId);
      setDeleteConfirmTableName(table.name);
      setDeleteConfirmOpen(true);
    } else {
      persistTables(tables.filter((t) => t.id !== tableId));
    }
  };

  const handleConfirmDeleteTable = () => {
    if (deleteConfirmTableId) {
      persistTables(tables.filter((t) => t.id !== deleteConfirmTableId));
      setDeleteConfirmOpen(false);
      setDeleteConfirmTableId(null);
      setDeleteConfirmTableName(null);
    }
  };

  // ─── Đổi tên bảng ─────────────────────────────────
  const handleRenameTable = (tableId: string, newName: string) => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, name: newName } : t)),
    );
  };

  // ─── Thay đổi hướng hiển thị bảng (ngang / dọc) ─────
  const handleUpdateTableLayout = (tableId: string, layout: 'horizontal' | 'vertical') => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, layout } : t)),
    );
  };

  // ─── Thay đổi trạng thái hiển thị tổng của bảng ──────
  const handleUpdateTableShowTotals = (tableId: string, showTotals: boolean) => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, showTotals } : t)),
    );
  };

  // ─── Thêm cột danh mục (drop từ sidebar) ──────────
  const handleDropCategory = (tableId: string, category: CategoryUi) => {
    persistTables(
      tables.map((t) => {
        if (t.id !== tableId) return t;
        // Kiểm tra trùng lặp
        const alreadyExists = t.columns.some(
          (c) => c.kind === 'category' && c.categoryId === category.id,
        );
        if (alreadyExists) return t;

        const newCol: ReportCategoryColumn = {
          id: crypto.randomUUID(),
          kind: 'category',
          categoryId: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          categoryType: category.type,
          displayName: category.name,
        };
        return { ...t, columns: [...t.columns, newCol] };
      }),
    );
  };

  // ─── Xóa cột ──────────────────────────────────────
  const handleDeleteColumn = (tableId: string, columnId: string) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId
          ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
          : t,
      ),
    );
  };

  // ─── Đổi tên cột ──────────────────────────────────
  const handleRenameColumn = (tableId: string, columnId: string, newName: string) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId
          ? {
            ...t,
            columns: t.columns.map((c) =>
              c.id === columnId ? { ...c, displayName: newName } : c,
            ),
          }
          : t,
      ),
    );
  };

  // ─── Cập nhật toàn bộ thuộc tính cột ──────────────
  const handleUpdateColumn = (tableId: string, columnId: string, updatedColumn: ReportColumn) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId
          ? {
            ...t,
            columns: t.columns.map((c) => (c.id === columnId ? updatedColumn : c)),
          }
          : t,
      ),
    );
  };

  // ─── Sắp xếp cột trong bảng ───────────────────────
  const handleReorderColumns = (tableId: string, newColumns: ReportColumn[]) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId ? { ...t, columns: newColumns } : t,
      ),
    );
  };

  // ─── Mở dialog thêm cột công thức ─────────────────
  const handleOpenFormulaDialog = (tableId: string, editColumn?: ReportColumn) => {
    setFormulaTargetTableId(tableId);
    setFormulaEditColumn(editColumn ?? null);
    setFormulaDialogOpen(true);
  };

  // ─── Lưu cột công thức ────────────────────────────
  const handleSaveFormulaColumn = (column: ReportColumn) => {
    if (!formulaTargetTableId) return;
    persistTables(
      tables.map((t) => {
        if (t.id !== formulaTargetTableId) return t;
        // Nếu đang edit → replace
        if (formulaEditColumn) {
          return {
            ...t,
            columns: t.columns.map((c) =>
              c.id === formulaEditColumn.id ? column : c,
            ),
          };
        }
        // Thêm mới
        return { ...t, columns: [...t.columns, column] };
      }),
    );
    setFormulaDialogOpen(false);
    setFormulaEditColumn(null);
    setFormulaTargetTableId(null);
  };

  // ─── Kéo thả sắp xếp bảng ─────────────────────────
  const dragTableId = useRef<string | null>(null);

  const handleTableDragStart = (tableId: string) => {
    dragTableId.current = tableId;
  };

  const handleTableDragOver = (e: React.DragEvent, targetTableId: string) => {
    e.preventDefault();
    if (!dragTableId.current || dragTableId.current === targetTableId) return;

    const fromIndex = tables.findIndex((t) => t.id === dragTableId.current);
    const toIndex = tables.findIndex((t) => t.id === targetTableId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...tables];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setTables(reordered);
  };

  const handleTableDragEnd = () => {
    dragTableId.current = null;
    // Lưu thứ tự mới
    saveTablesDebounced(tables);
  };

  // ─── Gán / gỡ gán giao dịch visually vào cột ─────────

  const handleAssignTransaction = (tableId: string, columnId: string, transactionId: string) => {
    persistTables(
      tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.id !== columnId || c.kind !== 'category') return c;
            const ids = c.transactionIds ?? [];
            if (ids.includes(transactionId)) return c;
            return { ...c, transactionIds: [...ids, transactionId] };
          }),
        };
      })
    );
  };

  const handleUnassignTransaction = (tableId: string, columnId: string, transactionId: string) => {
    persistTables(
      tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.map((c) => {
            if (c.id !== columnId || c.kind !== 'category') return c;
            const ids = c.transactionIds ?? [];
            return { ...c, transactionIds: ids.filter((id) => id !== transactionId) };
          }),
        };
      })
    );
  };

  // ─── Loading state ─────────────────────────────────
  const isPageLoading = catLoading || txLoading || configLoading;

  // ─── Lọc giao dịch chưa xếp cho sidebar ─────────────

  // Thu thập các category ID đã có cột trên bảng
  const usedCategoryIds = new Set<string>();
  // Thu thập các transaction ID đã được gán thủ công vào các cột
  const assignedTransactionIds = new Set<string>();

  tables.forEach((t) =>
    t.columns.forEach((c) => {
      if (c.kind === 'category') {
        usedCategoryIds.add(c.categoryId);
        if (c.transactionIds) {
          c.transactionIds.forEach((id) => assignedTransactionIds.add(id));
        }
      }
    }),
  );

  // Lọc danh sách giao dịch chưa xếp để truyền xuống sidebar (bỏ qua giao dịch chuyển tiền)
  const unassignedTransactions = transactions.filter(
    (tx) =>
      tx.type !== 'transfer' &&
      (!tx.category_id || !usedCategoryIds.has(tx.category_id)) &&
      !assignedTransactionIds.has(tx.id)
  );

  return (
    <PrivatePageShell
      title="Báo cáo"
      description="Bảng báo cáo tài chính tuỳ biến theo tháng."
      icon={BarChart3Icon}
      contentClassName="max-w-[1600px]"
      headerActions={
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <Loader2Icon className="size-3 animate-spin" />
              Đang lưu...
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => saveTablesImmediate(tables)}
            disabled={isSaving}
          >
            <SaveIcon className="size-3.5 mr-1.5" />
            Lưu
          </Button>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      }
    >
      {isPageLoading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3">
          <Loader2Icon className="size-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
        </div>
      ) : (
        <div className="mt-6 flex gap-6">
          {/* Sidebar danh mục và giao dịch */}
          <CategorySidebar
            categories={categories}
            usedCategoryIds={usedCategoryIds}
            transactions={unassignedTransactions}
          />

          {/* Nội dung chính: danh sách bảng */}
          <div className="flex-1 min-w-0 space-y-6">
            {tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card/30 p-12 text-center">
                <div className="rounded-2xl bg-primary/10 p-4 mb-4">
                  <BarChart3Icon className="size-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Chưa có bảng báo cáo</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Tạo bảng mới và kéo thả danh mục từ thanh bên để bắt đầu thiết lập
                  báo cáo tuỳ biến theo ý bạn.
                </p>
                <Button onClick={handleCreateTable} className="rounded-xl">
                  <PlusIcon className="size-4 mr-1.5" />
                  Tạo bảng đầu tiên
                </Button>
              </div>
            ) : (
              <>
                {tables.map((table) => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={() => handleTableDragStart(table.id)}
                    onDragOver={(e) => handleTableDragOver(e, table.id)}
                    onDragEnd={handleTableDragEnd}
                    className="group/table-drag"
                  >
                    <ReportTableCard
                      table={table}
                      transactions={transactions}
                      month={month}
                      onRenameTable={handleRenameTable}
                      onDeleteTable={handleDeleteTable}
                      onDropCategory={handleDropCategory}
                      onDeleteColumn={handleDeleteColumn}
                      onRenameColumn={handleRenameColumn}
                      onReorderColumns={handleReorderColumns}
                      onOpenFormulaDialog={handleOpenFormulaDialog}
                      onAssignTransaction={handleAssignTransaction}
                      onUnassignTransaction={handleUnassignTransaction}
                      onUpdateTableLayout={handleUpdateTableLayout}
                      onUpdateTableShowTotals={handleUpdateTableShowTotals}
                      onUpdateColumn={handleUpdateColumn}
                      dragHandle={
                        <button
                          className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/60 transition-colors"
                          title="Kéo để sắp xếp bảng"
                        >
                          <GripVerticalIcon className="size-4" />
                        </button>
                      }
                    />
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={handleCreateTable}
                  className="w-full rounded-xl border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 h-12 text-muted-foreground hover:text-primary transition-all"
                >
                  <PlusIcon className="size-4 mr-1.5" />
                  Thêm bảng mới
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialog cấu hình cột công thức */}
      <FormulaColumnDialog
        key={formulaDialogOpen ? (formulaEditColumn ? `edit-${formulaEditColumn.id}` : 'new') : 'closed'}
        open={formulaDialogOpen}
        onOpenChange={setFormulaDialogOpen}
        columns={
          formulaTargetTableId
            ? tables.find((t) => t.id === formulaTargetTableId)?.columns ?? []
            : []
        }
        editColumn={formulaEditColumn}
        onSave={handleSaveFormulaColumn}
      />

      {/* Dialog xác nhận xóa bảng */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
          <DialogHeader className="flex flex-col items-center text-center pt-6 pb-2">
            <div className="rounded-full bg-destructive/10 p-3 mb-2 text-destructive">
              <Trash2Icon className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold">Xóa bảng báo cáo?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 px-2">
              Bảng <strong className="text-foreground">&ldquo;{deleteConfirmTableName}&rdquo;</strong> đang chứa cấu hình dữ liệu.
              Bạn có chắc chắn muốn xóa bảng này không? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="w-full sm:flex-1 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteTable}
              className="w-full sm:flex-1 rounded-xl"
            >
              Xóa bảng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivatePageShell>
  );
}
