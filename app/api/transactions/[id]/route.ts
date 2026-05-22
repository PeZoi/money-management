import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
 * DELETE /api/transactions/[id]
 * Xóa giao dịch theo id (chỉ xóa được giao dịch trong workspace mà user là thành viên).
 * Balance tài khoản được cập nhật tự động bởi trigger trg_sync_account_balance.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  // Next.js 16 yêu cầu await params vì nó là Promise
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Thiếu id giao dịch." }, { status: 400 });
  }

  // Kiểm tra xem workspace của giao dịch có bị đóng băng không
  const { data: txData, error: txError } = await session.supabase
    .from("transactions")
    .select("workspace_id, workspaces (is_archived)")
    .eq("id", id)
    .maybeSingle();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }
  if (!txData) {
    return NextResponse.json({ error: "Giao dịch không tồn tại." }, { status: 404 });
  }

  const isArchived = (txData.workspaces as unknown as { is_archived: boolean }[] | null)?.[0]?.is_archived;
  if (isArchived) {
    return NextResponse.json(
      { error: "Nhóm này đã giải tán, không thể xóa giao dịch." },
      { status: 400 }
    );
  }

  const { error } = await session.supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/**
 * PUT /api/transactions/[id]
 * Cập nhật giao dịch theo ID.
 * Balance tài khoản được cập nhật tự động bởi trigger trg_sync_account_balance:
 *   - Hoàn tác tác động cũ (OLD row) lên tài khoản cũ
 *   - Áp dụng tác động mới (NEW row) lên tài khoản mới
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  // Next.js 16 yêu cầu await params vì nó là Promise
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Thiếu id giao dịch." }, { status: 400 });
  }

  // Kiểm tra xem workspace của giao dịch có bị đóng băng không
  const { data: txData, error: txError } = await session.supabase
    .from("transactions")
    .select("workspace_id, workspaces (is_archived)")
    .eq("id", id)
    .maybeSingle();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }
  if (!txData) {
    return NextResponse.json({ error: "Giao dịch không tồn tại." }, { status: 404 });
  }

  const isArchived = (txData.workspaces as unknown as { is_archived: boolean }[] | null)?.[0]?.is_archived;
  if (isArchived) {
    return NextResponse.json(
      { error: "Nhóm này đã giải tán, không thể cập nhật giao dịch." },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const category_id = isUuid(body.category_id) ? body.category_id : null;
  const account_id = isUuid(body.account_id) ? body.account_id : null;
  const to_account_id = isUuid(body.to_account_id) ? body.to_account_id : null;
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const created_at = typeof body.created_at === "string" && !isNaN(Date.parse(body.created_at)) ? body.created_at : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount phải là số dương." }, { status: 400 });
  }
  if (amount > 9999999999999) {
    return NextResponse.json({ error: "Số tiền quá lớn (tối đa 9,999,999,999,999đ)." }, { status: 400 });
  }

  // Cập nhật giao dịch — type không được thay đổi, trigger DB sẽ tự động điều chỉnh balance
  const { data, error } = await session.supabase
    .from("transactions")
    .update({
      amount,
      category_id: category_id || null,
      account_id: account_id || null,
      to_account_id: to_account_id || null,
      note: note || null,
      ...(created_at && { created_at }),
    })
    .eq("id", id)
    .select("*, category:categories(*), account:accounts!account_id(*), to_account:accounts!to_account_id(*)")
    .single();

  if (error) {
    let message = error.message;
    if (message.includes("numeric field overflow")) {
      message = "Số tiền giao dịch hoặc số dư vượt quá giới hạn tối đa của hệ thống.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
