import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DebtInsert } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function requireSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      supabase,
      user: null as null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { supabase, user, errorResponse: null as null };
}

/** Lấy danh sách người nợ của workspace: GET /api/debts?workspace_id= */
export async function GET(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!workspaceId || !isUuid(workspaceId)) {
    return NextResponse.json(
      { error: "Thiếu hoặc sai workspace_id (UUID) trong query." },
      { status: 400 }
    );
  }

  // Lấy danh sách debts thuộc workspace_id, sắp xếp theo ngày đến hạn (due_at) tăng dần
  const { data, error } = await session.supabase
    .from("debts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/** Tạo khoản nợ mới: POST /api/debts */
export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspace_id = typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
  const debtor_name = typeof body.debtor_name === "string" ? body.debtor_name.trim() : "";
  const amount = Number(body.amount);
  const borrowed_at = typeof body.borrowed_at === "string" ? body.borrowed_at.trim() : new Date().toISOString();
  const due_at = typeof body.due_at === "string" ? body.due_at.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : null;

  if (!workspace_id || !isUuid(workspace_id)) {
    return NextResponse.json({ error: "workspace_id phải là UUID hợp lệ." }, { status: 400 });
  }
  if (!debtor_name) {
    return NextResponse.json({ error: "Tên người nợ không được để trống." }, { status: 400 });
  }
  if (isNaN(amount) || amount < 0) {
    return NextResponse.json({ error: "Số tiền nợ phải lớn hơn hoặc bằng 0." }, { status: 400 });
  }
  if (!due_at) {
    return NextResponse.json({ error: "Ngày hẹn trả tiền không được để trống." }, { status: 400 });
  }

  const newDebt: DebtInsert = {
    workspace_id,
    debtor_name,
    amount,
    borrowed_at,
    due_at,
    note,
    status: "pending",
    notified: false,
    created_by: session.user.id,
  };

  const { data, error } = await session.supabase
    .from("debts")
    .insert([newDebt])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
