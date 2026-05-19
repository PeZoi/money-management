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

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const type = body.type === "income" || body.type === "expense" ? body.type : null;
  const category_id = isUuid(body.category_id) ? body.category_id : null;
  const note = typeof body.note === "string" ? body.note.trim() : null;
  const created_at = typeof body.created_at === "string" && !isNaN(Date.parse(body.created_at)) ? body.created_at : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount phải là số dương." }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "type phải là 'expense' hoặc 'income'." }, { status: 400 });
  }

  // Cập nhật thông tin giao dịch trong bảng transactions
  const { data, error } = await session.supabase
    .from("transactions")
    .update({
      amount,
      type,
      category_id: category_id || null,
      note: note || null,
      ...(created_at && { created_at }),
    })
    .eq("id", id)
    .select("*, category:categories(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

