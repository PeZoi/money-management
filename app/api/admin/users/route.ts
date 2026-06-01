import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/users
 * Trả về danh sách tất cả users trên hệ thống kèm role.
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { data, error } = await session.supabase.rpc("get_all_users_for_admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
