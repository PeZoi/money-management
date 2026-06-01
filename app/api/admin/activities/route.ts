import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/activities
 * Trả về 7 hoạt động hệ thống thực tế gần đây nhất (signups, workspaces, transactions).
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { data, error } = await session.supabase.rpc("get_admin_recent_activities");

  if (error) {
    console.error("GET /api/admin/activities: Lỗi lấy hoạt động:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
