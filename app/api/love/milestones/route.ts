import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { removeTempTag } from "../cloudinary-helper";

const milestoneCreateSchema = z.object({
  connectionId: z.string().uuid(),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().nullable().optional(),
  milestoneDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày cột mốc phải có định dạng YYYY-MM-DD"),
  icon: z.string().optional().default("Heart"),
  imageUrl: z.string().nullable().optional(),
});

/**
 * GET /api/love/milestones?connectionId=xxx&limit=12&cursor=...&order=desc
 * Lấy danh sách cột mốc kỷ niệm (hỗ trợ phân trang Cursor-based và tự nhận diện connection).
 */
export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  let connectionId = searchParams.get("connectionId");
  const cursor = searchParams.get("cursor");
  const limitParam = parseInt(searchParams.get("limit") || "12", 10);
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 12 : limitParam), 50);
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  // Nếu không truyền connectionId, tự động tra cứu từ session user
  if (!connectionId) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { data: connData } = await supabase.rpc("get_my_love_connection");
    if (connData && connData.length > 0) {
      connectionId = connData[0].connection_id;
    } else {
      return NextResponse.json({ data: [], next_cursor: null, has_more: false });
    }
  }

  // Khởi tạo query lấy milestones theo connection
  let query = supabase
    .from("love_milestones")
    .select("*")
    .eq("connection_id", connectionId);

  if (order === "desc") {
    if (cursor) {
      query = query.lt("milestone_date", cursor);
    }
    query = query.order("milestone_date", { ascending: false }).order("created_at", { ascending: false });
  } else {
    if (cursor) {
      query = query.gt("milestone_date", cursor);
    }
    query = query.order("milestone_date", { ascending: true }).order("created_at", { ascending: true });
  }

  const { data: rawRows, error } = await query.limit(limit + 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = rawRows ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].milestone_date : null;

  return NextResponse.json({
    data: pageRows,
    next_cursor: nextCursor,
    has_more: hasMore,
  });
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

    // Gỡ tag tạm cho các ảnh đã lưu chính thức
    if (imageUrl) {
      await removeTempTag(imageUrl);
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
