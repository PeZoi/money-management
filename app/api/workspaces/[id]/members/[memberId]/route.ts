import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

async function requireUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      supabase,
      user: null as null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { supabase, user, errorResponse: null as null };
}

/**
 * DELETE /api/workspaces/[id]/members/[memberId]
 * Kick thành viên khỏi nhóm.
 * Được bảo vệ bởi RLS policy, chỉ chủ nhóm (Owner) mới thực hiện được.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { id, memberId } = await params;
  if (!isUuid(id) || !isUuid(memberId)) {
    return NextResponse.json({ error: "ID nhóm hoặc ID thành viên không hợp lệ." }, { status: 400 });
  }

  // 1. Kiểm tra xem thành viên cần kick có phải là Owner không (Không được kick Owner)
  const { data: targetMember, error: findError } = await session.supabase
    .from("workspace_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("workspace_id", id)
    .maybeSingle();

  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
  if (!targetMember) {
    return NextResponse.json({ error: "Thành viên không tồn tại trong nhóm này." }, { status: 404 });
  }

  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Không thể kick chủ nhóm." }, { status: 400 });
  }

  // 2. Thực hiện xóa thành viên (chính sách RLS 'delete workspace members (owner_or_self)' sẽ đảm bảo chỉ Owner mới gọi được)
  const { error: deleteError } = await session.supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", id);

  if (deleteError) {
    return NextResponse.json({ error: "Bạn không có quyền kick thành viên hoặc có lỗi xảy ra." }, { status: 403 });
  }

  return NextResponse.json({ success: true, message: "Đã xóa thành viên khỏi nhóm." });
}
