/**
 * Types cho hệ thống báo cáo tuỳ biến (Custom Report).
 * Cấu hình bảng được lưu dưới dạng JSONB trong bảng `report_configs`.
 */

import type { IsoDateString, UuidString } from './database';

// ─── Giao dịch giả (chỉ xuất hiện ở report) ───────────
export interface ReportDummyTransaction {
  id: string; // UUID tự sinh phía client
  note: string; // Ghi chú giao dịch
  amount: number; // Số tiền
  type: 'expense' | 'income'; // Loại giao dịch
  created_at: string; // Ngày tạo (ISO date string)
}

// ─── Cột trong bảng báo cáo ───────────────────────────

/** Cột liên kết với một danh mục cụ thể */
export interface ReportCategoryColumn {
  id: string; // UUID tự sinh phía client
  kind: 'category';
  categoryId: string; // UUID danh mục gốc
  categoryName: string; // Tên gốc tại thời điểm thêm (snapshot)
  categoryIcon: string; // Icon gốc (snapshot)
  categoryType: 'expense' | 'income'; // Loại danh mục
  displayName: string; // Tên hiển thị tuỳ chỉnh (user có thể đổi)
  transactionIds?: string[]; // Danh sách các ID giao dịch thực tế gán visually
  dummyTransactions?: ReportDummyTransaction[]; // Danh sách các giao dịch giả lập
  width?: number; // Độ rộng cột (px)
}

/** Cột chỉ số hệ thống thống kê */
export interface ReportSystemColumn {
  id: string; // UUID tự sinh phía client
  kind: 'system';
  systemMetric: 'month_balance' | 'account_balance' | 'total_expense' | 'total_income';
  displayName: string; // Tên hiển thị (vd: "Số dư tài khoản", "Tổng tiền chi")
  width?: number; // Độ rộng cột (px)
}

/** Cột công thức tính toán dựa trên giá trị các cột khác */
export interface ReportFormulaColumn {
  id: string; // UUID tự sinh phía client
  kind: 'formula';
  displayName: string; // Tên hiển thị (vd: "Còn dư")
  /**
   * Biểu thức công thức đã biên dịch sang dạng column ID.
   * Ví dụ: "[col-uuid-1] + [col-uuid-2] - [col-uuid-3]"
   * Hỗ trợ: +, -, *, /, SUM(), dấu ngoặc ()
   */
  formula: string;
  width?: number; // Độ rộng cột (px)
}

/** Union type cho tất cả loại cột */
export type ReportColumn = ReportCategoryColumn | ReportSystemColumn | ReportFormulaColumn;

// ─── Bảng báo cáo ────────────────────────────────────

/** Cấu trúc một bảng trong báo cáo */
export interface ReportTable {
  id: string; // UUID tự sinh phía client
  name: string; // Tên bảng (user đặt)
  columns: ReportColumn[]; // Danh sách cột (thứ tự quan trọng)
  layout?: 'horizontal' | 'vertical'; // Hướng hiển thị bảng (ngang/dọc)
  showTotals?: boolean; // Trạng thái hiển thị tổng (mặc định true)
}

// ─── Cấu hình tổng hợp ──────────────────────────────

/** Row trong bảng `report_configs` */
export interface ReportConfigRow {
  id: UuidString;
  workspace_id: UuidString;
  month: string; // "YYYY-MM"
  tables: ReportTable[];
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

// ─── Payload cho API ──────────────────────────────────

export interface ReportConfigUpsertPayload {
  workspace_id: string;
  month: string;
  tables: ReportTable[];
}
