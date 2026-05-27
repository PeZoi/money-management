'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  ReportCategoryColumn,
  ReportColumn,
  ReportTable,
} from '@/types/report';
import type { CategoryUi } from '@/types/category';
import type { TransactionWithCategory } from '@/types/database';

import { useReportConfig } from './use-report-config';

// ─── Hook quản lý state và hành vi danh sách bảng ──────

export function useReportTables(month: string, transactions: TransactionWithCategory[]) {
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
  const handleCreateTable = useCallback(() => {
    const newTable: ReportTable = {
      id: crypto.randomUUID(),
      name: `Bảng ${tables.length + 1}`,
      columns: [],
    };
    persistTables([...tables, newTable]);
  }, [tables, persistTables]);

  // ─── Xóa bảng ─────────────────────────────────────
  const handleDeleteTable = useCallback((tableId: string) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    if (table.columns.length > 0) {
      setDeleteConfirmTableId(tableId);
      setDeleteConfirmTableName(table.name);
      setDeleteConfirmOpen(true);
    } else {
      persistTables(tables.filter((t) => t.id !== tableId));
    }
  }, [tables, persistTables]);

  const handleConfirmDeleteTable = useCallback(() => {
    if (deleteConfirmTableId) {
      persistTables(tables.filter((t) => t.id !== deleteConfirmTableId));
      setDeleteConfirmOpen(false);
      setDeleteConfirmTableId(null);
      setDeleteConfirmTableName(null);
    }
  }, [deleteConfirmTableId, tables, persistTables]);

  // ─── Đổi tên bảng ─────────────────────────────────
  const handleRenameTable = useCallback((tableId: string, newName: string) => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, name: newName } : t)),
    );
  }, [tables, persistTables]);

  // ─── Thay đổi hướng hiển thị bảng ─────────────────
  const handleUpdateTableLayout = useCallback((tableId: string, layout: 'horizontal' | 'vertical') => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, layout } : t)),
    );
  }, [tables, persistTables]);

  // ─── Thay đổi trạng thái hiển thị tổng ────────────
  const handleUpdateTableShowTotals = useCallback((tableId: string, showTotals: boolean) => {
    persistTables(
      tables.map((t) => (t.id === tableId ? { ...t, showTotals } : t)),
    );
  }, [tables, persistTables]);

  // ─── Thêm cột danh mục (drop từ sidebar) ──────────
  const handleDropCategory = useCallback((tableId: string, category: CategoryUi) => {
    persistTables(
      tables.map((t) => {
        if (t.id !== tableId) return t;
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
  }, [tables, persistTables]);

  // ─── Xóa cột ──────────────────────────────────────
  const handleDeleteColumn = useCallback((tableId: string, columnId: string) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId
          ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
          : t,
      ),
    );
  }, [tables, persistTables]);

  // ─── Đổi tên cột ──────────────────────────────────
  const handleRenameColumn = useCallback((tableId: string, columnId: string, newName: string) => {
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
  }, [tables, persistTables]);

  // ─── Cập nhật toàn bộ thuộc tính cột ──────────────
  const handleUpdateColumn = useCallback((tableId: string, columnId: string, updatedColumn: ReportColumn) => {
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
  }, [tables, persistTables]);

  // ─── Sắp xếp cột trong bảng ───────────────────────
  const handleReorderColumns = useCallback((tableId: string, newColumns: ReportColumn[]) => {
    persistTables(
      tables.map((t) =>
        t.id === tableId ? { ...t, columns: newColumns } : t,
      ),
    );
  }, [tables, persistTables]);

  // ─── Mở dialog thêm cột công thức ─────────────────
  const handleOpenFormulaDialog = useCallback((tableId: string, editColumn?: ReportColumn) => {
    setFormulaTargetTableId(tableId);
    setFormulaEditColumn(editColumn ?? null);
    setFormulaDialogOpen(true);
  }, []);

  // ─── Lưu cột công thức ────────────────────────────
  const handleSaveFormulaColumn = useCallback((column: ReportColumn) => {
    if (!formulaTargetTableId) return;
    persistTables(
      tables.map((t) => {
        if (t.id !== formulaTargetTableId) return t;
        if (formulaEditColumn) {
          return {
            ...t,
            columns: t.columns.map((c) =>
              c.id === formulaEditColumn.id ? column : c,
            ),
          };
        }
        return { ...t, columns: [...t.columns, column] };
      }),
    );
    setFormulaDialogOpen(false);
    setFormulaEditColumn(null);
    setFormulaTargetTableId(null);
  }, [formulaTargetTableId, formulaEditColumn, tables, persistTables]);

  // ─── Kéo thả sắp xếp bảng ─────────────────────────
  const dragTableId = useRef<string | null>(null);

  const handleTableDragStart = useCallback((tableId: string) => {
    dragTableId.current = tableId;
  }, []);

  const handleTableDragOver = useCallback((e: React.DragEvent, targetTableId: string) => {
    e.preventDefault();
    if (!dragTableId.current || dragTableId.current === targetTableId) return;

    setTables((prev) => {
      const fromIndex = prev.findIndex((t) => t.id === dragTableId.current);
      const toIndex = prev.findIndex((t) => t.id === targetTableId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...prev];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  }, []);

  const handleTableDragEnd = useCallback(() => {
    dragTableId.current = null;
    // Lưu thứ tự mới — dùng setTables callback để lấy state mới nhất
    setTables((current) => {
      saveTablesDebounced(current);
      return current;
    });
  }, [saveTablesDebounced]);

  // ─── Gán / gỡ gán giao dịch visually vào cột ──────
  const handleAssignTransaction = useCallback((tableId: string, columnId: string, transactionId: string) => {
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
  }, [tables, persistTables]);

  const handleUnassignTransaction = useCallback((tableId: string, columnId: string, transactionId: string) => {
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
  }, [tables, persistTables]);

  // ─── Lọc giao dịch chưa xếp cho sidebar ───────────
  const usedCategoryIds = new Set<string>();
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

  const unassignedTransactions = transactions.filter(
    (tx) =>
      tx.type !== 'transfer' &&
      (!tx.category_id || !usedCategoryIds.has(tx.category_id)) &&
      !assignedTransactionIds.has(tx.id)
  );

  return {
    // State
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
  };
}
