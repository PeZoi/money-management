import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
function parseType(v: unknown): TransactionType | null {
  return v === "income" || v === "expense" ? v : null;
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
 * GET /api/transactions?workspace_id=<uuid>
 * Trả về danh sách giao dịch kèm thông tin category.
 */
export async function GET(req: Request) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");

  if (!isUuid(workspaceId)) {
    return NextResponse.json(
      { error: "Thiếu hoặc sai workspace_id (UUID) trong query." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase
    .from("transactions")
    .select("*, category:categories(*)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/transactions
 * Body: { workspace_id, amount, type, category_id?, note? }
 */
export async function POST(req: Request) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const workspace_id = isUuid(body.workspace_id) ? body.workspace_id : null;
  const amount =
    typeof body.amount === "number" ? body.amount : Number(body.amount);
  const type = parseType(body.type);
  const category_id = isUuid(body.category_id) ? body.category_id : null;
  const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (!workspace_id) {
    return NextResponse.json(
      { error: "workspace_id phải là UUID hợp lệ." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "amount phải là số dương." },
      { status: 400 },
    );
  }
  if (!type) {
    return NextResponse.json(
      { error: "type phải là 'expense' hoặc 'income'." },
      { status: 400 },
    );
  }

  const { data, error } = await session.supabase
    .from("transactions")
    .insert([
      {
        workspace_id,
        amount,
        type,
        category_id,
        note,
        created_by: session.user.id,
      },
    ])
    .select("*, category:categories(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
