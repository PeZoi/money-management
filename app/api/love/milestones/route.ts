import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const milestoneCreateSchema = z.object({
  connectionId: z.string().uuid(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().nullable().optional(),
  milestoneDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày cột mốc phải có định dạng YYYY-MM-DD"),
  icon: z.string().optional().default("Heart"),
  imageUrl: z.string().nullable().optional(),
});

/**
 * GET /api/love/milestones?connectionId=xxx
 * Lấy danh sách tất cả các cột mốc của kết nối.
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");

  if (!connectionId) {
    return NextResponse.json({ error: "Thiếu ID kết nối" }, { status: 400 });
  }

  // RLS sẽ tự lọc hoặc chặn nếu user không thuộc connection này
  const { data, error } = await supabase
    .from("love_milestones")
    .select("*")
    .eq("connection_id", connectionId)
    .order("milestone_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/love/milestones
 * Tạo một cột mốc kỷ niệm mới.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  // Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = milestoneCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { connectionId, title, description, milestoneDate, icon, imageUrl } = parsed.data;

    // Chèn cột mốc mới vào database
    // RLS sẽ chặn nếu user không thuộc connectionId này
    const { data, error } = await supabase
      .from("love_milestones")
      .insert({
        connection_id: connectionId,
        title,
        description,
        milestone_date: milestoneDate,
        icon,
        image_url: imageUrl,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Tạo cột mốc kỷ niệm thành công!",
      data,
    });
  } catch {
    return NextResponse.json(
      { error: "Định dạng JSON không hợp lệ hoặc lỗi hệ thống" },
      { status: 500 }
    );
  }
}
