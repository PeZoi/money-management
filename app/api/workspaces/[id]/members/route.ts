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
 * GET /api/workspaces/[id]/members
 * Lấy danh sách thành viên chi tiết của workspace (bao gồm email, display_name, avatar_url).
 * Gọi qua RPC get_workspace_member_details.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID nhóm không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .rpc("get_workspace_member_details", { ws_id: id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map member_id sang id để đồng bộ với kiểu dữ liệu của Client mong đợi
  const mappedData = (data ?? []).map((m: {
    member_id: string;
    user_id: string;
    role: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    status: string;
  }) => ({
    ...m,
    id: m.member_id,
  }));

  return NextResponse.json({ data: mappedData });
}

/**
 * POST /api/workspaces/[id]/members
 * Body: { email: string }
 * Mời thành viên mới vào nhóm bằng email.
 * Gọi qua RPC add_workspace_member_by_email.
 */
export async function POST(
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
  if (!body || typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ error: "Email không hợp lệ." }, { status: 400 });
  }

  // Mặc định vai trò của thành viên mới là 'member'
  const { data, error } = await session.supabase
    .rpc("add_workspace_member_by_email", {
      ws_id: id,
      member_email: body.email.trim(),
      member_role: "member",
    });

  if (error) {
    let message = error.message;
    // Bắt và dịch các lỗi custom trả về từ SQL Function
    if (message.includes("Không tìm thấy người dùng")) {
      message = "Không tìm thấy người dùng với email này. Vui lòng kiểm tra lại.";
    } else if (message.includes("đã là thành viên")) {
      message = "Người dùng này đã là thành viên trong nhóm rồi.";
    } else if (message.includes("Chỉ quản trị viên")) {
      message = "Bạn không có quyền mời thành viên (yêu cầu quyền Admin hoặc Owner).";
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true, member_id: data }, { status: 201 });
}
