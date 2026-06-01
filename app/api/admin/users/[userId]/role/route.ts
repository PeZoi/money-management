import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PATCH /api/admin/users/[userId]/role
 * Body: { role: "admin" | "user" }
 * Cập nhật vai trò hệ thống của một người dùng.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireAdmin();
  if (session.errorResponse) return session.errorResponse;

  const { userId } = await params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "ID người dùng không hợp lệ." }, { status: 400 });
  }

  // Không cho phép admin tự thay đổi role của chính mình
  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Không thể thay đổi vai trò của chính mình." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || !["admin", "user"].includes(body.role)) {
    return NextResponse.json(
      { error: "Vai trò phải là 'admin' hoặc 'user'." },
      { status: 400 }
    );
  }

  const newRole = body.role as "admin" | "user";

  // Kiểm tra user đó có tồn tại row trong user_roles không
  const { data: existingRole, error: checkError } = await session.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (existingRole) {
    // Cập nhật role hiện tại
    const { error: updateError } = await session.supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    // Insert row mới nếu chưa có
    const { error: insertError } = await session.supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Đã cập nhật vai trò thành "${newRole === "admin" ? "Quản trị viên" : "Người dùng"}".`,
  });
}
