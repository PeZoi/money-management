/**
 * Types khớp với `database/schema.sql` (public tables + enums).
 * Timestamps là chuỗi ISO khi nhận từ Supabase REST/JSON (PostgREST).
 */

export type IsoDateString = string;

/** Enum `public.user_role` */
export type UserRole = "user" | "admin";

/** Enum `public.workspace_role` */
export type WorkspaceRole = "owner" | "admin" | "member";

/** Enum `public.transaction_type` */
export type TransactionType = "expense" | "income" | "transfer";

/** Enum `public.account_type` */
export type AccountType = "cash" | "bank" | "e_wallet" | "investment" | "other";

export type UuidString = string;

/** `numeric(14,0)` — VND, không phần lẻ */
export type VndAmount = number | string;

export interface UserRolesRow {
  user_id: UuidString;
  role: UserRole;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface WorkspaceRow {
  id: UuidString;
  name: string;
  is_personal: boolean;
  created_by: UuidString;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface WorkspaceMemberRow {
  id: UuidString;
  workspace_id: UuidString;
  user_id: UuidString;
  role: WorkspaceRole;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface CategoryRow {
  id: UuidString;
  workspace_id: UuidString;
  name: string;
  icon: string;
  type: TransactionType;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface AccountRow {
  id: UuidString;
  workspace_id: UuidString;
  name: string;
  type: AccountType;
  balance: VndAmount;
  currency: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_by: UuidString;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface TransactionRow {
  id: UuidString;
  workspace_id: UuidString;
  amount: VndAmount;
  type: TransactionType;
  category_id: UuidString | null;
  account_id: UuidString | null;
  to_account_id: UuidString | null;
  note: string | null;
  created_by: UuidString;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

/** Insert không gửi cột có default/trigger */
export type UserRolesInsert = Pick<UserRolesRow, "user_id"> & Partial<Pick<UserRolesRow, "role">>;

export type WorkspaceInsert = Pick<WorkspaceRow, "name" | "created_by"> &
  Partial<Pick<WorkspaceRow, "is_personal">>;

export type WorkspaceMemberInsert = Pick<
  WorkspaceMemberRow,
  "workspace_id" | "user_id" | "role"
>;

export type CategoryInsert = Pick<CategoryRow, "workspace_id" | "name" | "icon" | "type">;

export type TransactionInsert = Pick<
  TransactionRow,
  "workspace_id" | "amount" | "type" | "created_by"
> &
  Partial<Pick<TransactionRow, "category_id" | "account_id" | "to_account_id" | "note">>;

/** Update partial — thường không đổi PK / FK chính */
export type WorkspaceUpdate = Partial<Pick<WorkspaceRow, "name" | "is_personal">>;

export type WorkspaceMemberUpdate = Partial<Pick<WorkspaceMemberRow, "role">>;

export type CategoryUpdate = Partial<Pick<CategoryRow, "name" | "icon" | "type">>;

export type AccountInsert = Pick<AccountRow, "workspace_id" | "name" | "type" | "icon" | "color" | "created_by"> &
  Partial<Pick<AccountRow, "balance" | "currency" | "is_active">>;

export type AccountUpdate = Partial<Pick<AccountRow, "name" | "type" | "balance" | "icon" | "color" | "is_active" | "currency">>;

export type TransactionUpdate = Partial<
  Pick<TransactionRow, "amount" | "category_id" | "account_id" | "to_account_id" | "note">
>;

/** Relations phổ biến trong UI */
export type TransactionWithCategory = TransactionRow & {
  category: CategoryRow | null;
  account: AccountRow | null;
  to_account: AccountRow | null;
  created_by_details?: {
    display_name: string;
    email: string;
    avatar_url: string | null;
  };
};

export interface LoveConnectionRow {
  id: UuidString;
  user_id_1: UuidString;
  user_id_2: UuidString;
  anniversary_date: string;
  user_1_avatar_url: string | null;
  user_2_avatar_url: string | null;
  background_url: string | null;
  theme: string;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface LoveMilestoneRow {
  id: UuidString;
  connection_id: UuidString;
  title: string;
  description: string | null;
  milestone_date: string;
  icon: string;
  image_url: string | null;
  created_by: UuidString;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

export interface MyLoveConnection {
  connection_id: UuidString;
  partner_id: UuidString;
  partner_name: string;
  partner_avatar_url: string | null;
  partner_email: string;
  anniversary_date: string;
  days_together: number;
  background_url: string | null;
  user_1_avatar_url: string | null;
  user_2_avatar_url: string | null;
  is_user_1?: boolean;
  user_1_nickname: string | null;
  user_2_nickname: string | null;
  user_1_birthdate: string | null;
  user_2_birthdate: string | null;
  partner_birthdate: string | null;
  theme: string | null;
}

export interface AdminLoveUser {
  id: UuidString;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  partner_id: UuidString | null;
  partner_name: string | null;
  anniversary_date: string | null;
  connection_id: UuidString | null;
}
