import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/health
 * Trả về dung lượng database thực tế.
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { data, error } = await session.supabase.rpc("get_admin_system_health");

  if (error) {
    console.error("GET /api/admin/health: Lỗi lấy dung lượng database:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  const dbSizeBytes = result?.db_size_bytes ?? 0;

  return NextResponse.json({
    data: {
      dbSizeBytes,
      status: "healthy",
    },
  });
}
