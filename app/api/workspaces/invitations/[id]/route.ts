import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/**
 * PATCH /api/workspaces/invitations/[id]
 * Chấp nhận lời mời (action = 'accept')
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID lời mời không hợp lệ." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || body.action !== "accept") {
    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("accept_workspace_invitation", {
    inv_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy lời mời hoặc bạn không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/workspaces/invitations/[id]
 * Từ chối lời mời
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "ID lời mời không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("decline_workspace_invitation", {
    inv_id: id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy lời mời hoặc bạn không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
