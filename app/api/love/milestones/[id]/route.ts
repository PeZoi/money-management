import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const milestoneUpdateSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().nullable().optional(),
  milestoneDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày cột mốc phải có định dạng YYYY-MM-DD"),
  icon: z.string().optional().default("Heart"),
  imageUrl: z.string().nullable().optional(),
});

/**
 * PATCH /api/love/milestones/[id]
 * Cập nhật cột mốc kỷ niệm.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const supabase = createClient();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Thiếu ID cột mốc" }, { status: 400 });
  }

  // Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = milestoneUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, milestoneDate, icon, imageUrl } = parsed.data;

    // RLS sẽ tự chặn nếu user không thuộc connection chứa cột mốc này
    const { data, error } = await supabase
      .from("love_milestones")
      .update({
        title,
        description,
        milestone_date: milestoneDate,
        icon,
        image_url: imageUrl,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Không tìm thấy cột mốc hoặc bạn không có quyền cập nhật" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật cột mốc kỷ niệm thành công!",
      data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Định dạng JSON không hợp lệ hoặc lỗi hệ thống" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/love/milestones/[id]
 * Xóa cột mốc kỷ niệm.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const supabase = createClient();
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Thiếu ID cột mốc" }, { status: 400 });
  }

  // Kiểm tra đăng nhập
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // RLS sẽ tự chặn nếu user không thuộc connection chứa cột mốc này
  const { data, error } = await supabase
    .from("love_milestones")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Không tìm thấy cột mốc hoặc bạn không có quyền xóa" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Xóa cột mốc kỷ niệm thành công!",
  });
}
