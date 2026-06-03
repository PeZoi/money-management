import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { z } from "zod";

const connectSchema = z.object({
  userId1: z.string().uuid(),
  userId2: z.string().uuid(),
  anniversaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kỷ niệm phải có định dạng YYYY-MM-DD"),
});

/**
 * POST /api/admin/love/connect
 * Bắt cặp kết nối tình yêu cho 2 người dùng (chỉ cho Admin).
 */
export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  try {
    const body = await request.json();
    const parsed = connectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId1, userId2, anniversaryDate } = parsed.data;

    if (userId1 === userId2) {
      return NextResponse.json(
        { error: "Không thể bắt cặp một người với chính họ" },
        { status: 400 }
      );
    }

    // Insert vào table love_connections
    const { data, error } = await session.supabase
      .from("love_connections")
      .insert({
        user_id_1: userId1,
        user_id_2: userId2,
        anniversary_date: anniversaryDate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Bắt cặp thành công!",
      data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Định dạng JSON không hợp lệ hoặc lỗi hệ thống" },
      { status: 500 }
    );
  }
}
