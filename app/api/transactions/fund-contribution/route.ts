import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

async function requireUser() {
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

/**
 * POST /api/transactions/fund-contribution
 * Body: { personal_workspace_id, personal_account_id, group_workspace_id, group_account_id, amount, note? }
 */
export async function POST(req: Request) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const personal_workspace_id = isUuid(body.personal_workspace_id) ? body.personal_workspace_id : null;
  const personal_account_id = isUuid(body.personal_account_id) ? body.personal_account_id : null;
  const group_workspace_id = isUuid(body.group_workspace_id) ? body.group_workspace_id : null;
  const group_account_id = isUuid(body.group_account_id) ? body.group_account_id : null;
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (!personal_workspace_id || !personal_account_id || !group_workspace_id || !group_account_id) {
    return NextResponse.json(
      { error: "Thiếu thông tin các workspace hoặc tài khoản (phải là UUID hợp lệ)." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Số tiền nộp phải là số dương." },
      { status: 400 },
    );
  }

  if (amount > 9999999999999) {
    return NextResponse.json(
      { error: "Số tiền quá lớn (tối đa 9,999,999,999,999đ)." },
      { status: 400 },
    );
  }

  // Gọi RPC handle_fund_contribution trong database
  const { data, error } = await session.supabase.rpc("handle_fund_contribution", {
    p_personal_workspace_id: personal_workspace_id,
    p_personal_account_id: personal_account_id,
    p_group_workspace_id: group_workspace_id,
    p_group_account_id: group_account_id,
    p_amount: amount,
    p_note: note,
    p_user_id: session.user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Không thể thực hiện nộp quỹ." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, data });
}
