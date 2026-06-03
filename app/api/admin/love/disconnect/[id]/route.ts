import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/admin/love/disconnect/[id]
 * Hủy bắt cặp của một kết nối tình yêu (chỉ cho Admin).
 */
export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "Thiếu ID kết nối" },
      { status: 400 }
    );
  }

  const { error } = await session.supabase
    .from("love_connections")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Hủy bắt cặp thành công!",
  });
}
