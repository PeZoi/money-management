import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// Lấy API Key phục vụ kết nối iOS Shortcuts của người dùng
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    let currentApiKey: string | null = null;

    // 1. Kiểm tra trong bảng user_shortcut_keys trước
    try {
      const { data, error } = await supabaseAdmin
        .from("user_shortcut_keys")
        .select("api_key")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.api_key) {
        currentApiKey = data.api_key;
      }
    } catch {
      // Bỏ qua nếu bảng chưa tồn tại
    }

    // 2. Nếu chưa có trong bảng, kiểm tra trong user_metadata của Supabase Auth
    if (!currentApiKey) {
      const metaKey = user.user_metadata?.shortcut_api_key;
      if (typeof metaKey === "string" && metaKey.trim()) {
        currentApiKey = metaKey.trim();
      }
    }

    return NextResponse.json({
      success: true,
      apiKey: currentApiKey, // Trả về string hoặc null (để frontend hiện nút "Tạo mã")
    });
  } catch (error) {
    console.error("Lỗi trong GET /api/shortcuts/key:", error);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}

// Tạo mã mới hoặc Tạo lại (Regenerate) API Key
export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const newKey = `mk_${crypto.randomBytes(24).toString("hex")}`;

    // 1. Lưu vào user_metadata (Đảm bảo an toàn 100% không phụ thuộc migration bảng)
    try {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          shortcut_api_key: newKey,
        },
      });
    } catch (metaErr) {
      console.warn("Không thể cập nhật user_metadata:", metaErr);
    }

    // 2. Lưu vào bảng user_shortcut_keys (nếu bảng đã được migrate)
    try {
      await supabaseAdmin.from("user_shortcut_keys").upsert(
        {
          user_id: user.id,
          api_key: newKey,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    } catch (dbErr) {
      console.warn("Bảng user_shortcut_keys chưa tồn tại, đã lưu vào user_metadata:", dbErr);
    }

    return NextResponse.json({
      success: true,
      apiKey: newKey,
      message: "Đã tạo API Key thành công!",
    });
  } catch (error) {
    console.error("Lỗi trong POST /api/shortcuts/key:", error);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}
