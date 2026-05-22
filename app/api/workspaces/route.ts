import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/workspaces?is_archived=true|false
 * Lấy danh sách workspace mà user hiện tại là thành viên.
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isArchived = searchParams.get("is_archived") === "true";

  const { data, error } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspaces (
        id,
        name,
        is_personal,
        is_archived,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "accepted");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter theo trạng thái is_archived của workspace
  const list = (data as unknown as {
    role: string;
    workspaces: {
      id: string;
      name: string;
      is_personal: boolean;
      is_archived: boolean;
      created_by: string;
      created_at: string;
    } | null;
  }[])
    ?.filter((item) => item.workspaces && item.workspaces.is_archived === isArchived)
    ?.map((item) => ({
      ...item.workspaces!,
      role: item.role,
    })) || [];

  return NextResponse.json({ data: list });
}

/**
 * POST /api/workspaces
 * Body: { name: string }
 * Tạo một workspace nhóm mới và gán user hiện tại làm Owner.
 */
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "Tên nhóm không được để trống." }, { status: 400 });
  }

  // Gọi RPC để tạo workspace và gán thành viên owner atomic
  const { data: ws, error: wsError } = await supabase
    .rpc("create_workspace_with_member", {
      workspace_name: body.name.trim(),
    });

  if (wsError) {
    return NextResponse.json({ error: wsError.message }, { status: 500 });
  }

  return NextResponse.json({ data: ws }, { status: 201 });
}
