import type { User } from "@supabase/supabase-js";

import type { CurrentUserSnapshot } from "@/types/user";

/** Google OAuth thường đặt trong user_metadata — điều chỉnh theo provider của bạn */
function pickDisplayName(meta: Record<string, unknown>): string | null {
  const full =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;
  return full?.trim() || null;
}

function pickAvatarUrl(meta: Record<string, unknown>): string | null {
  const url =
    typeof meta.avatar_url === "string"
      ? meta.avatar_url
      : typeof meta.picture === "string"
        ? meta.picture
        : null;
  return url?.trim() || null;
}

/** Map `auth.users` (Supabase) → `CurrentUserSnapshot`. Chỉ chứa thông tin public từ JWT/metadata. */
export function mapSupabaseUserToSnapshot(user: User): CurrentUserSnapshot {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: pickDisplayName(meta),
    avatarUrl: pickAvatarUrl(meta),
  };
}

/**
 * Gộp thêm dữ liệu từ Postgres (profile, workspace_members, …).
 * Luôn đặt mapSupabase làm base rồi spread field custom.
 */
export function mergeCurrentUserSnapshot(
  base: CurrentUserSnapshot,
  extra: Partial<Pick<CurrentUserSnapshot, "workspaceRole" | "roleLabel">>,
): CurrentUserSnapshot {
  return { ...base, ...extra };
}
