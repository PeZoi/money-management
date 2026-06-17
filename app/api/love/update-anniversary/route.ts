import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateSchema = z.object({
  connectionId: z.string().uuid(),
  anniversaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kỷ niệm phải có định dạng YYYY-MM-DD"),
});

/**
 * PATCH /api/love/update-anniversary
 * Cập nhật ngày kỷ niệm của cặp đôi.
 */
export async function PATCH(request: Request) {
  const supabase = createClient();

  // Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { connectionId, anniversaryDate } = parsed.data;

    // Update table love_connections
    // RLS sẽ chặn nếu user không phải là thành viên của connection này hoặc không phải admin
    const { data, error } = await supabase
      .from("love_connections")
      .update({ anniversary_date: anniversaryDate })
      .eq("id", connectionId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Không tìm thấy kết nối hoặc bạn không có quyền cập nhật" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật ngày kỷ niệm thành công!",
      data,
    });
  } catch {
    return NextResponse.json(
      { error: "Định dạng JSON không hợp lệ hoặc lỗi hệ thống" },
      { status: 500 }
    );
  }
}
