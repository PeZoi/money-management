import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * GET /api/admin/analytics
 * Trả về dữ liệu tăng trưởng (30 ngày qua) và cơ cấu loại hình workspace.
 */
export async function GET() {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  // 1. Lấy dữ liệu tăng trưởng
  const { data: growthData, error: growthError } = await session.supabase.rpc(
    "get_admin_growth_analytics"
  );

  if (growthError) {
    console.error("GET /api/admin/analytics: Lỗi tăng trưởng:", growthError.message);
    return NextResponse.json({ error: growthError.message }, { status: 500 });
  }

  // 2. Lấy dữ liệu cơ cấu workspace
  const { data: compositionData, error: compError } = await session.supabase.rpc(
    "get_admin_workspace_composition"
  );

  if (compError) {
    console.error("GET /api/admin/analytics: Lỗi cơ cấu:", compError.message);
    return NextResponse.json({ error: compError.message }, { status: 500 });
  }

  const composition = Array.isArray(compositionData) ? compositionData[0] : compositionData;

  return NextResponse.json({
    data: {
      growth: growthData ?? [],
      composition: composition ?? { personal_count: 0, group_count: 0 },
    },
  });
}
