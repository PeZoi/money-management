'use client';

import { useMemo } from 'react';

import type {
  ReportDummyTransaction,
  ReportTable,
} from '@/types/report';
import type { TransactionWithCategory } from '@/types/database';
import { useAccounts } from '@/hooks/use-accounts';

import { evaluateFormula } from '../lib/formula-engine';

// ─── Hook tính toán dữ liệu bảng báo cáo ─────────────

interface UseReportTableDataParams {
  table: ReportTable;
  transactions: TransactionWithCategory[];
}

export function useReportTableData({ table, transactions }: UseReportTableDataParams) {
  const { columns } = table;
  const { accounts } = useAccounts();

  // Cột dữ liệu có thể tham chiếu trong công thức
  const dataColumns = useMemo(
    () => columns.filter((c) => c.kind === 'category' || c.kind === 'system'),
    [columns],
  );

  // Nhóm giao dịch theo từng cột danh mục (mặc định + gán visually + giao dịch giả)
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

  return {
    dataColumns,
    columnTransactions,
    maxRows,
    columnTotals,
  };
}

// ─── Type export cho component con ────────────────────

export type ColumnTransactionsMap = Map<string, (TransactionWithCategory | ReportDummyTransaction)[]>;
export type ColumnTotalsMap = Map<string, number>;
