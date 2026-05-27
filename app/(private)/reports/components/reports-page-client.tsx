'use client';

import {
  BarChart3Icon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  SaveIcon,
} from 'lucide-react';
import { useState } from 'react';

import { MonthPicker } from '@/components/month-picker';
import { PrivatePageShell } from '@/components/private-page-shell';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';

import { useReportTransactions } from '../hooks/use-report-transactions';
import { useReportTables } from '../hooks/use-report-tables';
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

  // ─── Data hooks ────────────────────────────────────
  const { categories, isLoading: catLoading } = useCategories();
  const { transactions, isLoading: txLoading } = useReportTransactions(month);

  // ─── Hook quản lý bảng ─────────────────────────────
  const {
    tables,
    configLoading,
    isSaving,
    saveTablesImmediate,

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

  // ─── Loading state ─────────────────────────────────
  const isPageLoading = catLoading || txLoading || configLoading;

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
      <DeleteTableDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        tableName={deleteConfirmTableName}
        onConfirm={handleConfirmDeleteTable}
      />
    </PrivatePageShell>
  );
}
