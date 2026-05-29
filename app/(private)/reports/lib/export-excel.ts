import type { ReportTable } from '@/types/report';
import type { AccountRow, TransactionWithCategory } from '@/types/database';

import { evaluateFormula } from './formula-engine';

// ─── Tham số đầu vào cho hàm xuất Excel ──────────────

export interface ExportExcelParams {
  tables: ReportTable[];
  transactions: TransactionWithCategory[];
  accounts: AccountRow[];
  month: string;
}

// ─── Helpers ──────────────────────────────────────────

/** Tính số ngày thực tế trong tháng (nếu là tháng hiện tại thì lấy ngày hiện tại) */
function getDaysInMonth(monthStr: string): number {
  if (!monthStr) return 30;
  const [year, monthVal] = monthStr.split('-').map(Number);
  if (!year || !monthVal) return 30;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDate = now.getDate();

  const totalDaysInMonth = new Date(year, monthVal, 0).getDate();

  if (year === currentYear && monthVal === currentMonth) {
    return Math.max(1, currentDate);
  }
  return totalDaysInMonth;
}

/** Định dạng số tiền VND: làm tròn + dấu phân cách hàng nghìn */
function formatNumber(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('vi-VN');
}

/** Loại bỏ hậu tố "(Chỉ số)" khỏi tên cột (tương thích dữ liệu cũ trong DB) */
function cleanDisplayName(name: string): string {
  return name.replace(/\s*\(Chỉ số\)/gi, '');
}

// ─── CSS cho file HTML Excel ──────────────────────────

const EXCEL_STYLES = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #334155;
    margin: 20px;
  }
  .header-table {
    margin-bottom: 24px;
    border: none;
    width: 100%;
  }
  .header-table td {
    border: none;
    padding: 0;
  }
  table {
    border-collapse: collapse;
    margin-bottom: 30px;
    background-color: #ffffff;
  }
  th {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: bold;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    padding: 10px 12px;
    text-align: center;
  }
  td {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    font-size: 13px;
    color: #334155;
  }
  .table-title-cell {
    background-color: #1e293b !important;
    color: #ffffff !important;
    font-weight: bold;
    font-size: 15px;
    padding: 12px;
    text-align: left;
  }
  .text-center {
    text-align: center;
  }
  .text-right {
    text-align: right;
  }
  .number-cell {
    text-align: right;
    font-family: 'Consolas', 'Courier New', monospace;
  }
  .income-text {
    color: #059669;
    font-weight: bold;
  }
  .expense-text {
    color: #dc2626;
    font-weight: bold;
  }
  .system-cell {
    background-color: #eff6ff;
    color: #1d4ed8;
  }
  .formula-cell {
    background-color: #fffbeb;
    color: #b45309;
  }
  .total-row td {
    background-color: #f0fdf4;
    color: #166534;
    font-weight: bold;
    border-top: 2px double #166534;
    border-bottom: 2px solid #166534;
  }
  .total-row .expense-total {
    color: #b91c1c;
  }
  .total-row .income-total {
    color: #047857;
  }`;

// ─── Sinh CSS class cho mỗi loại cột ─────────────────

function getColumnStyleClass(col: ReportTable['columns'][number]): string {
  if (col.kind === 'category') {
    return col.categoryType === 'expense' ? 'expense-text' : 'income-text';
  }
  if (col.kind === 'system') return 'system-cell';
  if (col.kind === 'formula') return 'formula-cell';
  return '';
}

function getColumnTotalStyleClass(col: ReportTable['columns'][number]): string {
  if (col.kind === 'category') {
    return col.categoryType === 'expense' ? 'expense-total' : 'income-total';
  }
  if (col.kind === 'system') return 'system-cell';
  if (col.kind === 'formula') return 'formula-cell';
  return '';
}

// ─── Ô số tiền ép kiểu text cho Excel ────────────────

function moneyCell(value: number, extraClass = ''): string {
  return `<td x:str class="number-cell ${extraClass}" style="mso-number-format:'\\@';">${formatNumber(value)}</td>`;
}

// ─── Tính tổng grand total (chỉ cộng cột category) ───

function calcGrandTotal(
  columnTotalsMap: Map<string, number>,
  columns: ReportTable['columns'],
): number {
  return Array.from(columnTotalsMap.entries())
    .filter(([colId]) => {
      const col = columns.find((c) => c.id === colId);
      return col?.kind === 'category';
    })
    .reduce((sum, [colId, val]) => {
      const col = columns.find((c) => c.id === colId);
      const multiplier =
        col && col.kind === 'category' && col.categoryType === 'expense' ? -1 : 1;
      return sum + val * multiplier;
    }, 0);
}

// ─── Sinh header HTML ─────────────────────────────────

function buildHeaderHtml(
  month: string,
  totalAccountBalance: number,
  maxColsInTables: number,
): string {
  return `
  <table class="header-table" style="border: none; border-collapse: collapse; margin-bottom: 24px; width: 100%;">
    <tr>
      <td colspan="${maxColsInTables}" style="padding: 16px 0 8px 0; border: none; text-align: left; vertical-align: middle;">
        <span style="font-size: 22pt; font-weight: bold; color: #1e293b; font-family: 'Segoe UI', Arial, sans-serif; letter-spacing: -0.5px;">BÁO CÁO TÀI CHÍNH TỔNG HỢP</span>
      </td>
    </tr>
    <tr>
      <td colspan="${maxColsInTables}" style="padding: 0 0 16px 0; border: none; text-align: left; font-size: 10.5pt; color: #64748b; font-family: 'Segoe UI', Arial, sans-serif; border-bottom: 2px solid #cbd5e1;">
        <strong>Tháng báo cáo:</strong> <span style="color: #0f172a; font-weight: bold;">${month}</span> &nbsp;|&nbsp; 
        <strong>Ngày xuất:</strong> <span style="color: #0f172a;">${new Date().toLocaleString('vi-VN')}</span>
      </td>
    </tr>
    <tr style="height: 12px; border: none;"><td colspan="${maxColsInTables}" style="border: none; height: 12px;">&nbsp;</td></tr>
    <tr>
      <td colspan="${maxColsInTables}" style="padding: 14px 18px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; text-align: left; font-family: 'Segoe UI', Arial, sans-serif;">
        <span style="color: #047857; font-weight: bold; font-size: 12.5pt; letter-spacing: 0.2px;">
          TỔNG SỐ DƯ TÀI SẢN: <span style="font-size: 13.5pt; color: #065f46; font-family: 'Segoe UI', Consolas, monospace;">${formatNumber(totalAccountBalance)}</span> VND
        </span>
      </td>
    </tr>
    <tr style="height: 20px; border: none;"><td colspan="${maxColsInTables}" style="border: none; height: 20px;">&nbsp;</td></tr>
  </table>`;
}

// ─── Spacer giữa các bảng ─────────────────────────────

const TABLE_SPACER = `
  <table style="border: none; margin: 0; padding: 0; border-collapse: collapse;">
    <tr style="border: none; background: transparent; height: 24px;"><td style="border: none; height: 24px; padding: 0;">&nbsp;</td></tr>
  </table>`;

// ─── Sinh bảng dọc (Vertical) ─────────────────────────

function buildVerticalTableHtml(
  table: ReportTable,
  tableIdx: number,
  columnTotalsMap: Map<string, number>,
): string {
  const { columns, name: tableName, showTotals } = table;
  const sheetTitle = tableName || `Bảng ${tableIdx + 1}`;

  let html = `
  <table>
    <colgroup>
      <col width="60" />
      <col width="320" />
      <col width="200" />
    </colgroup>
    <thead>
      <tr>
        <th colspan="3" class="table-title-cell">${tableIdx + 1}. BẢNG: ${sheetTitle.toUpperCase()}</th>
      </tr>
      <tr>
        <th>STT</th>
        <th>Hạng mục (Hàng)</th>
        <th>Số tiền (VND)</th>
      </tr>
    </thead>
    <tbody>
`;

  columns.forEach((col, idx) => {
    const val = columnTotalsMap.get(col.id) ?? 0;
    let kindText = '';
    const styleClass = getColumnStyleClass(col);

    if (col.kind === 'category') {
      kindText = col.categoryType === 'expense' ? ' (Chi)' : ' (Thu)';
    } else if (col.kind === 'formula') {
      kindText = ' (Công thức)';
    }
    // col.kind === 'system' → không hiện "(Chỉ số)"

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="${styleClass}">${cleanDisplayName(col.displayName)}${kindText}</td>
        ${moneyCell(val, styleClass)}
      </tr>
`;
  });

  if (showTotals !== false) {
    const grandTotal = calcGrandTotal(columnTotalsMap, columns);
    const totalStyle = grandTotal < 0 ? 'expense-total' : 'income-total';

    html += `
      <tr class="total-row">
        <td class="text-center">Σ</td>
        <td>Tổng thực thu/chi (chỉ cộng các dòng danh mục)</td>
        ${moneyCell(grandTotal, totalStyle)}
      </tr>
`;
  }

  html += `
    </tbody>
  </table>
`;

  return html;
}

// ─── Sinh bảng ngang (Horizontal) ─────────────────────

function buildHorizontalTableHtml(
  table: ReportTable,
  tableIdx: number,
  columnTransactionsMap: Map<string, { amount: string | number }[]>,
  columnTotalsMap: Map<string, number>,
  maxRows: number,
): string {
  const { columns, name: tableName, showTotals } = table;
  const sheetTitle = tableName || `Bảng ${tableIdx + 1}`;
  const totalCols = columns.length + (showTotals !== false ? 2 : 1);

  // Colgroup
  let html = `
  <table>
    <colgroup>
      <col width="60" />
`;
  columns.forEach(() => {
    html += `      <col width="180" />\n`;
  });
  if (showTotals !== false) {
    html += `      <col width="180" />\n`;
  }
  html += `    </colgroup>\n`;

  // Thead
  html += `
    <thead>
      <tr>
        <th colspan="${totalCols}" class="table-title-cell">${tableIdx + 1}. BẢNG: ${sheetTitle.toUpperCase()}</th>
      </tr>
      <tr>
        <th>STT</th>
`;
  columns.forEach((col) => {
    let label = cleanDisplayName(col.displayName);
    if (col.kind === 'category') {
      label += col.categoryType === 'expense' ? ' (Chi)' : ' (Thu)';
    } else if (col.kind === 'formula') {
      label += ' (Công thức)';
    }
    // col.kind === 'system' → không hiện "(Chỉ số)"
    html += `        <th>${label}</th>\n`;
  });
  if (showTotals !== false) {
    html += `        <th>Tổng</th>\n`;
  }
  html += `
      </tr>
    </thead>
    <tbody>
`;

  // Tbody – các hàng dữ liệu
  for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
    let rowTotal = 0;
    const rowColValues = new Map<string, number>();

    // Lần 1: tính giá trị cột category
    for (const col of columns) {
      if (col.kind === 'category') {
        const txs = columnTransactionsMap.get(col.id) ?? [];
        const val = txs[rowIdx] ? Number(txs[rowIdx].amount) : 0;
        rowColValues.set(col.id, val);
        const multiplier = col.categoryType === 'expense' ? -1 : 1;
        rowTotal += val * multiplier;
      }
    }

    // Lần 2: tính giá trị cột formula
    for (const col of columns) {
      if (col.kind === 'formula') {
        const result = evaluateFormula(col.formula, rowColValues);
        rowColValues.set(col.id, result ?? 0);
      }
    }

    html += `
      <tr>
        <td class="text-center">${rowIdx + 1}</td>
`;

    columns.forEach((col) => {
      const styleClass = getColumnStyleClass(col);

      if (col.kind === 'system') {
        if (rowIdx === 0) {
          const val = columnTotalsMap.get(col.id) ?? 0;
          html += `        ${moneyCell(val, styleClass)}\n`;
        } else {
          html += `        <td class="text-center ${styleClass}">—</td>\n`;
        }
      } else {
        const val = rowColValues.get(col.id) ?? 0;
        html += `        ${moneyCell(val, styleClass)}\n`;
      }
    });

    if (showTotals !== false) {
      const totalClass = rowTotal < 0 ? 'expense-text' : 'income-text';
      html += `        ${moneyCell(rowTotal, totalClass)}\n`;
    }

    html += `      </tr>\n`;
  }

  // Tfoot – dòng tổng cộng
  if (showTotals !== false) {
    html += `
      <tr class="total-row">
        <td class="text-center">Σ</td>
`;

    columns.forEach((col) => {
      const val = columnTotalsMap.get(col.id) ?? 0;
      const styleClass = getColumnTotalStyleClass(col);
      html += `        ${moneyCell(val, styleClass)}\n`;
    });

    const grandTotal = calcGrandTotal(columnTotalsMap, columns);
    const totalClass = grandTotal < 0 ? 'expense-total' : 'income-total';
    html += `        ${moneyCell(grandTotal, totalClass)}\n`;
    html += `      </tr>\n`;
  }

  html += `
    </tbody>
  </table>
`;

  return html;
}

// ─── Hàm chính: xuất file Excel ──────────────────────

/**
 * Sinh nội dung HTML Excel và tải xuống dưới dạng file `.xls`.
 * Trả về `true` nếu xuất thành công, `false` nếu thất bại.
 */
export function exportReportToExcel({
  tables,
  transactions,
  accounts,
  month,
}: ExportExcelParams): boolean {
  try {
    const daysInMonth = getDaysInMonth(month);
    const totalAccountBalance = accounts.reduce(
      (sum, a) => sum + Number(a.balance),
      0,
    );

    // Tính số cột tối đa để áp dụng colspan cho header
    let maxColsInTables = 3;
    tables.forEach((t) => {
      const colCount = t.columns.length + (t.showTotals !== false ? 2 : 1);
      if (colCount > maxColsInTables) maxColsInTables = colCount;
    });

    // Bắt đầu xây dựng HTML
    let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook>
  <x:ExcelWorksheets>
    <x:ExcelWorksheet>
      <x:Name>Báo cáo tổng hợp</x:Name>
      <x:WorksheetOptions>
        <x:DisplayGridlines/>
      </x:WorksheetOptions>
    </x:ExcelWorksheet>
  </x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml><![endif]-->
<style>${EXCEL_STYLES}
</style>
</head>
<body>
${buildHeaderHtml(month, totalAccountBalance, maxColsInTables)}
`;

    // Duyệt qua từng bảng
    tables.forEach((table, tableIdx) => {
      const { columns, layout } = table;

      // Phân nhóm giao dịch theo từng cột category
      const columnTransactionsMap = new Map<string, { amount: string | number }[]>();
      const catCols = columns.filter((c) => c.kind === 'category');
      for (const col of catCols) {
        const systemTxs = transactions.filter(
          (t) =>
            t.category_id === col.categoryId ||
            (col.transactionIds ?? []).includes(t.id),
        );
        const dummyTxs = col.dummyTransactions ?? [];
        columnTransactionsMap.set(col.id, [...systemTxs, ...dummyTxs]);
      }

      // Tính số dòng dữ liệu tối đa
      let maxRows = 0;
      for (const txs of columnTransactionsMap.values()) {
        if (txs.length > maxRows) maxRows = txs.length;
      }
      maxRows = columns.length > 0 ? Math.max(maxRows, 1) : 0;

      // Tính totals cho từng cột
      const columnTotalsMap = new Map<string, number>();

      // Cột category
      for (const col of columns) {
        if (col.kind === 'category') {
          const txs = columnTransactionsMap.get(col.id) ?? [];
          columnTotalsMap.set(
            col.id,
            txs.reduce((sum, t) => sum + Number(t.amount), 0),
          );
        }
      }

      // Cột system
      const realIncomeTotal = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const realExpenseTotal = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

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
          } else if (col.systemMetric === 'avg_daily_expense') {
            value = realExpenseTotal / daysInMonth;
          } else if (col.systemMetric === 'transaction_count') {
            value = transactions.length;
          }
          columnTotalsMap.set(col.id, value);
        }
      }

      // Cột công thức
      for (const col of columns) {
        if (col.kind === 'formula') {
          const result = evaluateFormula(col.formula, columnTotalsMap);
          columnTotalsMap.set(col.id, result ?? 0);
        }
      }

      // Spacer giữa các bảng
      if (tableIdx > 0) {
        htmlContent += TABLE_SPACER;
      }

      // Sinh HTML bảng theo layout
      if (layout === 'vertical') {
        htmlContent += buildVerticalTableHtml(table, tableIdx, columnTotalsMap);
      } else {
        htmlContent += buildHorizontalTableHtml(
          table,
          tableIdx,
          columnTransactionsMap,
          columnTotalsMap,
          maxRows,
        );
      }
    });

    htmlContent += `
</body>
</html>
`;

    // Tải file xuống
    const blob = new Blob([htmlContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `money-report-${month}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Xuất báo cáo Excel thất bại:', error);
    return false;
  }
}
