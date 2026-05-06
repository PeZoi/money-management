import type {
  CategoryRow,
  TransactionRow,
  TransactionType,
  UuidString,
  VndAmount,
  WorkspaceMemberRow,
  WorkspaceRow,
} from "@/types/database";

/** Payload cho `POST /api/transactions` (legacy route — khác schema chi tiết hơn) */
export interface CreateTransactionLegacyBody {
  amount: number;
  type: "income" | "expense";
  category?: string | null;
  occurred_at?: string;
  note?: string | null;
  account_id: string;
}

export interface ApiHealthResponse {
  ok: boolean;
  service: string;
}

export interface ApiErrorBody {
  error: string;
}

export interface TransactionsListResponse {
  data: TransactionRow[];
}

export interface TransactionCreateResponse {
  data: TransactionRow;
}

/** Chuẩn cho API bọc trong `{ data }` */
export interface ApiDataResponse<T> {
  data: T;
}

/** Hỗ trợ UX: workspace + vai trò hiện tại */
export interface WorkspaceWithMembership extends WorkspaceRow {
  membership?: Pick<WorkspaceMemberRow, "id" | "role"> | null;
}

/** Chuẩn list categories theo workspace */
export type CategoriesListResponse = ApiDataResponse<CategoryRow[]>;

/** Form tạo giao dịch (theo schema mới trong DB) */
export interface TransactionFormValues {
  workspace_id: UuidString;
  amount: VndAmount;
  type: TransactionType;
  category_id: UuidString | "";
  note: string;
}
