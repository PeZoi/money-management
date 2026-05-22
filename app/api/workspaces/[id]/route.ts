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
 * PATCH /api/workspaces/[id]
 * Cập nhật tên, giải tán nhóm (archive/tất toán) hoặc chuyển nhượng chủ nhóm.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID nhóm không hợp lệ." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // 1. Kiểm tra vai trò của user hiện tại trong workspace
  const { data: membership, error: memberError } = await session.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  if (!membership) {
    return NextResponse.json({ error: "Bạn không phải thành viên của nhóm này." }, { status: 403 });
  }

  const isOwner = membership.role === "owner";
  const isAdminOrOwner = membership.role === "owner" || membership.role === "admin";

  // 2. Xử lý chuyển nhượng Owner (Owner Transfer)
  if (body.owner_id) {
    if (!isOwner) {
      return NextResponse.json({ error: "Chỉ chủ nhóm mới được chuyển nhượng quyền chủ nhóm." }, { status: 403 });
    }
    const newOwnerId = body.owner_id;
    if (!isUuid(newOwnerId)) {
      return NextResponse.json({ error: "ID chủ nhóm mới không hợp lệ." }, { status: 400 });
    }

    // Kiểm tra xem user được chuyển nhượng có ở trong nhóm không
    const { data: targetMember, error: targetError } = await session.supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", id)
      .eq("user_id", newOwnerId)
      .maybeSingle();

    if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
    if (!targetMember) {
      return NextResponse.json({ error: "Người nhận chuyển nhượng phải là thành viên của nhóm." }, { status: 400 });
    }

    // Thực hiện chuyển nhượng
    const { error: demoteError } = await session.supabase
      .from("workspace_members")
      .update({ role: "member" })
      .eq("workspace_id", id)
      .eq("user_id", session.user.id);

    if (demoteError) return NextResponse.json({ error: demoteError.message }, { status: 500 });

    const { error: promoteError } = await session.supabase
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("workspace_id", id)
      .eq("user_id", newOwnerId);

    if (promoteError) {
      // Rollback nếu lỗi
      await session.supabase
        .from("workspace_members")
        .update({ role: "owner" })
        .eq("workspace_id", id)
        .eq("user_id", session.user.id);
      return NextResponse.json({ error: promoteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Chuyển nhượng quyền chủ nhóm thành công." });
  }

  // 3. Xử lý Giải tán nhóm (Archive) & Tất toán
  if (body.is_archived === true) {
    if (!isOwner) {
      return NextResponse.json({ error: "Chỉ chủ nhóm mới có quyền giải tán nhóm." }, { status: 403 });
    }

    // Gọi RPC handle_workspace_settlement để giải tán và tất toán atomic
    const { error: settleError } = await session.supabase
      .rpc("handle_workspace_settlement", {
        p_workspace_id: id,
        p_user_id: session.user.id,
        p_settle_up: body.settle_up === true
      });

    if (settleError) {
      return NextResponse.json({ error: settleError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Giải tán nhóm thành công." });
  }

  // 4. Cập nhật thông tin thông thường (Đổi tên nhóm)
  if (body.name) {
    if (!isAdminOrOwner) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật thông tin nhóm này." }, { status: 403 });
    }

    const { data: updatedWs, error: updateError } = await session.supabase
      .from("workspaces")
      .update({ name: body.name.trim() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ data: updatedWs });
  }

  return NextResponse.json({ error: "Không có tham số cập nhật hợp lệ." }, { status: 400 });
}

/**
 * DELETE /api/workspaces/[id]
 * Rời khỏi nhóm hoặc xóa nhóm khỏi danh sách lưu trữ cá nhân.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID nhóm không hợp lệ." }, { status: 400 });
  }

  // Lấy thông tin trạng thái is_archived của workspace
  const { data: workspace, error: wsError } = await session.supabase
    .from("workspaces")
    .select("is_archived")
    .eq("id", id)
    .maybeSingle();

  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 });
  if (!workspace) return NextResponse.json({ error: "Không tìm thấy nhóm." }, { status: 404 });

  // 1. Kiểm tra tư cách thành viên của user hiện tại
  const { data: membership, error: memberError } = await session.supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  if (!membership) {
    return NextResponse.json({ error: "Bạn không phải thành viên của nhóm này." }, { status: 403 });
  }

  const isOwner = membership.role === "owner";

  // 2. Nếu nhóm đã giải tán và người xóa là Owner, thực hiện Hard Delete luôn
  if (workspace.is_archived && isOwner) {
    const { error: deleteWsError } = await session.supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (deleteWsError) return NextResponse.json({ error: deleteWsError.message }, { status: 500 });

    return NextResponse.json({ success: true, message: "Xóa vĩnh viễn nhóm thành công." });
  }

  // 3. Nếu nhóm chưa giải tán và là Owner, kiểm tra xem còn thành viên khác không
  if (!workspace.is_archived && isOwner) {
    const { count, error: countError } = await session.supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

    // Nếu còn thành viên khác, bắt buộc Owner phải chuyển nhượng trước khi rời nhóm
    if (count && count > 1) {
      return NextResponse.json(
        { error: "Bạn là chủ nhóm. Vui lòng chuyển nhượng quyền chủ nhóm cho thành viên khác trước khi rời nhóm." },
        { status: 400 }
      );
    }
  }

  // 4. Xóa user ra khỏi danh sách thành viên (cho trường hợp Member rời nhóm hoặc Owner rời nhóm cuối cùng)
  const { error: deleteError } = await session.supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", id)
    .eq("user_id", session.user.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // 5. Nếu không còn bất kỳ thành viên nào khác trong nhóm, thực hiện Hard Delete workspace
  const { count: remainingCount, error: checkRemainingError } = await session.supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", id);

  if (!checkRemainingError && remainingCount === 0) {
    // Xóa vĩnh viễn workspace cùng toàn bộ tài nguyên (cascade ở DB sẽ tự động xóa transactions, accounts, categories)
    await session.supabase
      .from("workspaces")
      .delete()
      .eq("id", id);
  }

  return NextResponse.json({ success: true, message: "Rời khỏi nhóm thành công." });
}
