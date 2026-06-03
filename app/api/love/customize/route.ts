import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const customizeSchema = z.object({
  connectionId: z.string().uuid(),
  user1AvatarUrl: z.string().url("Định dạng link avatar 1 không hợp lệ").nullable().optional(),
  user2AvatarUrl: z.string().url("Định dạng link avatar 2 không hợp lệ").nullable().optional(),
  backgroundUrl: z.string().url("Định dạng link ảnh nền không hợp lệ").nullable().optional(),
  user1Nickname: z.string().max(50, "Biệt danh tối đa 50 ký tự").nullable().optional(),
  user2Nickname: z.string().max(50, "Biệt danh tối đa 50 ký tự").nullable().optional(),
  user1Birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày sinh của bạn không hợp lệ (YYYY-MM-DD)").nullable().optional(),
  user2Birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày sinh của người ấy không hợp lệ (YYYY-MM-DD)").nullable().optional(),
  theme: z.string().max(20).optional(),
});

/**
 * PATCH /api/love/customize
 * Cập nhật link URL ảnh tùy chỉnh hoặc reset về mặc định.
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
    const parsed = customizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { 
      connectionId, 
      user1AvatarUrl, 
      user2AvatarUrl, 
      backgroundUrl,
      user1Nickname,
      user2Nickname,
      user1Birthdate,
      user2Birthdate,
      theme
    } = parsed.data;

    // Build payload cập nhật
    const updatePayload: Record<string, any> = {};
    if (user1AvatarUrl !== undefined) updatePayload.user_1_avatar_url = user1AvatarUrl;
    if (user2AvatarUrl !== undefined) updatePayload.user_2_avatar_url = user2AvatarUrl;
    if (backgroundUrl !== undefined) updatePayload.background_url = backgroundUrl;
    if (user1Nickname !== undefined) updatePayload.user_1_nickname = user1Nickname;
    if (user2Nickname !== undefined) updatePayload.user_2_nickname = user2Nickname;
    if (user1Birthdate !== undefined) updatePayload.user_1_birthdate = user1Birthdate;
    if (user2Birthdate !== undefined) updatePayload.user_2_birthdate = user2Birthdate;
    if (theme !== undefined) updatePayload.theme = theme;

    // Cập nhật database (RLS sẽ đảm bảo chỉ cặp đôi/admin mới update được)
    const { data, error } = await supabase
      .from("love_connections")
      .update(updatePayload)
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
      message: "Cập nhật giao diện thành công!",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Lỗi hệ thống: ${err.message}` },
      { status: 500 }
    );
  }
}
