import type { WorkspaceRole } from "@/types/database";

export type WorkspaceInfo = {
  id: string;
  name: string;
  is_personal: boolean;
  created_by: string;
  role: WorkspaceRole;
};

/**
 * User “ứng dụng” — tách khỏi `User` của Supabase để bạn tự mở rộng field.
 * Session thật vẫn nằm trong cookie (Supabase); đây chỉ là dữ liệu bạn map để dùng UI / logic.
 */
export interface CurrentUserSnapshot {
  id: string;
  email: string | null;
  avatarUrl: string | null;
  /** Tên hiển thị ưu tiên từ metadata Google/OAuth */
  displayName: string | null;
  /** Gắn sau khi query `workspace_members` / API */
  workspaceRole?: WorkspaceRole;
  /** Nhãn hiển thị cho badge (tuỳ ngôn ngữ) */
  roleLabel?: string;
  /** Danh sách các workspace mà user có quyền truy cập */
  workspaces?: WorkspaceInfo[];
}
