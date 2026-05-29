'use client';

import {
  BarChart3Icon,
  DownloadIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import { useAccounts } from '@/hooks/use-accounts';
import { cn } from '@/lib/utils';

import { useReportTransactions } from '../hooks/use-report-transactions';
import { useReportTables } from '../hooks/use-report-tables';
import { exportReportToExcel } from '../lib/export-excel';
import { CategorySidebar } from './category-sidebar';
import { FormulaColumnDialog } from './formula-column-dialog';
import { ReportTableCard } from './report-table-card';
import { DeleteTableDialog } from './delete-table-dialog';

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

  // ─── Workspace & Accounts ──────────────────────────
  const { accounts } = useAccounts();

  // ─── Data hooks ────────────────────────────────────
  const { categories, isLoading: catLoading } = useCategories();
  const { transactions, isLoading: txLoading } = useReportTransactions(month);

  // ─── Hook quản lý bảng ─────────────────────────────
  const {
    tables,
    configLoading,
    isSaving,
    saveTablesImmediate,
    hasUnsavedChanges,

    // Delete confirm dialog
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    deleteConfirmTableName,

    // Formula dialog
    formulaDialogOpen,
    setFormulaDialogOpen,
    formulaTargetTableId,
    formulaEditColumn,

    // Table handlers
    handleCreateTable,
    handleDeleteTable,
    handleConfirmDeleteTable,
    handleRenameTable,
    handleUpdateTableLayout,
    handleUpdateTableShowTotals,
    handleDropCategory,
    handleDropSystemMetric,
    handleDeleteColumn,
    handleRenameColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleOpenFormulaDialog,
    handleSaveFormulaColumn,
    handleAssignTransaction,
    handleUnassignTransaction,

    // Drag-drop bảng
    handleTableDragStart,
    handleTableDragOver,
    handleTableDragEnd,

    // Sidebar data
    usedCategoryIds,
    unassignedTransactions,
  } = useReportTables(month, transactions);

  // ─── Dữ liệu hiển thị (Không còn chế độ nhập file) ───
  const displayTables = tables;
  const displayTransactions = transactions;
  const isReadOnly = false;

  // ─── Loading state ─────────────────────────────────
  const isPageLoading = catLoading || txLoading || configLoading;

  const handleExport = () => {
    if (tables.length === 0) {
      toast.error('Không có bảng nào để xuất');
      return;
    }

    const success = exportReportToExcel({ tables, transactions, accounts, month });
    if (success) {
      toast.success('Xuất báo cáo Excel thành công');
    } else {
      toast.error('Xuất báo cáo Excel thất bại');
    }
  };

  // ─── Cảnh báo người dùng khi reload hoặc tắt tab nếu chưa lưu ──
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn có những thay đổi chưa được lưu. Bạn có chắc chắn muốn rời đi?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // ─── Đổi tháng ──
  const handleMonthChange = (newMonth: string) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'Bạn có những thay đổi chưa lưu. Việc chuyển đổi tháng sẽ làm mất các thay đổi này. Bạn có chắc chắn muốn tiếp tục?'
      );
      if (!confirmLeave) return;
    }
    setMonth(newMonth);
  };

  return (
    <PrivatePageShell
      title="Báo cáo"
      description="Bảng báo cáo tài chính tuỳ biến theo tháng."
      icon={BarChart3Icon}
      contentClassName="max-w-[1600px]"
      headerActions={
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isSaving && !isReadOnly && (
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground animate-pulse mr-1">
              <Loader2Icon className="size-3 animate-spin" />
              <span className="hidden sm:inline">Đang lưu...</span>
            </span>
          )}

          {/* Hiển thị badge ⚠️ Có thay đổi chưa lưu */}
          {hasUnsavedChanges && !isReadOnly && (
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1.5 rounded-xl border border-amber-500/20 mr-1 sm:mr-2 animate-in fade-in duration-300">
              ⚠️ <span className="hidden sm:inline">Chưa lưu thay đổi</span>
            </span>
          )}

          {/* Nút Lưu hiển thị ở cả Mobile và Desktop nếu không phải chế độ chỉ đọc */}
          {!isReadOnly && (
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-xl px-3 h-10 sm:h-9 transition-all duration-300",
                hasUnsavedChanges && "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              )}
              onClick={() => saveTablesImmediate(tables)}
              disabled={isSaving}
            >
              <SaveIcon className="size-3.5 mr-1.5" />
              Lưu
            </Button>
          )}

          {/* Nút Xuất Excel chỉ hiển thị từ màn hình sm trở lên (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl hover:bg-muted cursor-pointer px-3"
              onClick={handleExport}
              disabled={tables.length === 0}
              title={tables.length === 0 ? 'Tạo bảng để xuất file Excel' : 'Xuất báo cáo hiện tại ra file Excel'}
            >
              <DownloadIcon className="size-3.5 mr-1.5" />
              Xuất Excel
            </Button>
          </div>

          <MonthPicker value={month} onChange={handleMonthChange} />
        </div>
      }
    >
      {isPageLoading ? (
        <div className="mt-16 flex flex-col items-center justify-center gap-3">
          <Loader2Icon className="size-8 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar danh mục và giao dịch (Ẩn ở chế độ chỉ đọc) */}
            {!isReadOnly && (
              <CategorySidebar
                categories={categories}
                usedCategoryIds={usedCategoryIds}
                transactions={unassignedTransactions}
                allTransactions={transactions}
                onDeleteColumn={handleDeleteColumn}
              />
            )}

            {/* Nội dung chính: danh sách bảng */}
            <div className="flex-1 min-w-0 space-y-6">
              {displayTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card/30 p-12 text-center">
                  <div className="rounded-2xl bg-primary/10 p-4 mb-4">
                    <BarChart3Icon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Chưa có bảng báo cáo</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    {isReadOnly
                      ? 'Tệp tin báo cáo này không chứa bất kỳ bảng nào.'
                      : 'Tạo bảng mới và kéo thả danh mục từ thanh bên để bắt đầu thiết lập báo cáo tuỳ biến theo ý bạn.'}
                  </p>
                  {!isReadOnly && (
                    <Button onClick={handleCreateTable} className="rounded-xl">
                      <PlusIcon className="size-4 mr-1.5" />
                      Tạo bảng đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {displayTables.map((table) => (
                    <div
                      key={table.id}
                      draggable={!isReadOnly}
                      onDragStart={!isReadOnly ? () => handleTableDragStart(table.id) : undefined}
                      onDragOver={!isReadOnly ? (e) => handleTableDragOver(e, table.id) : undefined}
                      onDragEnd={!isReadOnly ? handleTableDragEnd : undefined}
                      className={cn('group/table-drag', !isReadOnly && 'cursor-grab active:cursor-grabbing')}
                    >
                      <ReportTableCard
                        table={table}
                        transactions={displayTransactions}
                        month={month}
                        onRenameTable={handleRenameTable}
                        onDeleteTable={handleDeleteTable}
                        onDropCategory={handleDropCategory}
                        onDropSystemMetric={handleDropSystemMetric}
                        onDeleteColumn={handleDeleteColumn}
                        onRenameColumn={handleRenameColumn}
                        onReorderColumns={handleReorderColumns}
                        onOpenFormulaDialog={handleOpenFormulaDialog}
                        onAssignTransaction={handleAssignTransaction}
                        onUnassignTransaction={handleUnassignTransaction}
                        onUpdateTableLayout={handleUpdateTableLayout}
                        onUpdateTableShowTotals={handleUpdateTableShowTotals}
                        onUpdateColumn={handleUpdateColumn}
                        readOnly={isReadOnly}
                        dragHandle={
                          !isReadOnly ? (
                            <button
                              className="cursor-grab active:cursor-grabbing p-1 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/60 transition-colors"
                              title="Kéo để sắp xếp bảng"
                            >
                              <GripVerticalIcon className="size-4" />
                            </button>
                          ) : null
                        }
                      />
                    </div>
                  ))}

                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      onClick={handleCreateTable}
                      className="w-full rounded-xl border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 h-12 text-muted-foreground hover:text-primary transition-all"
                    >
                      <PlusIcon className="size-4 mr-1.5" />
                      Thêm bảng mới
                    </Button>
                  )}
                </>
              )}
            </div>
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
            ? displayTables.find((t) => t.id === formulaTargetTableId)?.columns ?? []
            : []
        }
        editColumn={formulaEditColumn}
        onSave={handleSaveFormulaColumn}
      />

      {/* Dialog xác nhận xóa bảng */}
      <DeleteTableDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        tableName={deleteConfirmTableName}
        onConfirm={handleConfirmDeleteTable}
      />
    </PrivatePageShell>
  );
}
