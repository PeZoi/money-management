import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/love/users
 * Lấy danh sách tất cả người dùng và trạng thái bắt cặp của họ (chỉ cho Admin).
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { data, error } = await session.supabase.rpc("get_users_love_status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
