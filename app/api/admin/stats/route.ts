import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/stats
 * Trả về thống kê tổng quan hệ thống (tổng users, workspaces, giao dịch).
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { data, error } = await session.supabase.rpc("get_admin_stats");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC trả về mảng 1 phần tử cho RETURNS TABLE
  const stats = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({ data: stats });
}
