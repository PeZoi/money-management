import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DebtUpdate } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

type RouteContext = { params: Promise<{ id: string }> };

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

/** Cập nhật thông tin nợ: PATCH /api/debts/[id] */
export async function PATCH(req: Request, context: RouteContext) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await context.params;
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: "id không hợp lệ." }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: DebtUpdate = {};

  if ("debtor_name" in body) {
    if (typeof body.debtor_name !== "string" || !body.debtor_name.trim()) {
      return NextResponse.json({ error: "Tên người nợ không được để trống." }, { status: 400 });
    }
    patch.debtor_name = body.debtor_name.trim();
  }

  if ("amount" in body) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "Số tiền nợ phải lớn hơn hoặc bằng 0." }, { status: 400 });
    }
    patch.amount = amount;
  }

  if ("borrowed_at" in body) {
    if (typeof body.borrowed_at !== "string" || !body.borrowed_at.trim()) {
      return NextResponse.json({ error: "Ngày mượn tiền không hợp lệ." }, { status: 400 });
    }
    patch.borrowed_at = body.borrowed_at.trim();
  }

  if ("due_at" in body) {
    if (typeof body.due_at !== "string" || !body.due_at.trim()) {
      return NextResponse.json({ error: "Ngày hẹn trả tiền không hợp lệ." }, { status: 400 });
    }
    patch.due_at = body.due_at.trim();
  }

  if ("status" in body) {
    if (body.status !== "pending" && body.status !== "paid") {
      return NextResponse.json({ error: "Trạng thái nợ phải là pending hoặc paid." }, { status: 400 });
    }
    patch.status = body.status;
  }

  if ("note" in body) {
    patch.note = typeof body.note === "string" ? body.note.trim() : null;
  }

  if ("notified" in body) {
    patch.notified = Boolean(body.notified);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Không có trường nào để cập nhật." }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("debts")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy khoản nợ hoặc không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ data });
}

/** Xóa khoản nợ: DELETE /api/debts/[id] */
export async function DELETE(_req: Request, context: RouteContext) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await context.params;
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: "id không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy khoản nợ hoặc không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ data: { id: data.id } });
}
