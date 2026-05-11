import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CategoryInsert, TransactionType } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parseTransactionType(value: unknown): TransactionType | null {
  if (value === "expense" || value === "income") return value;
  return null;
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

/** Danh sách danh mục theo workspace: `GET ?workspace_id=&type=` */
export async function GET(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspace_id");
  const typeFilter = parseTransactionType(searchParams.get("type"));

  if (!workspaceId || !isUuid(workspaceId)) {
    return NextResponse.json(
      { error: "Thiếu hoặc sai workspace_id (UUID) trong query." },
      { status: 400 },
    );
  }

  let q = session.supabase
    .from("categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });

  if (typeFilter) {
    q = q.eq("type", typeFilter);
  }

  const { data, error } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workspace_id = typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const icon = typeof body.icon === "string" ? body.icon.trim() : "";
  const colorRaw = typeof body.color === "string" ? body.color.trim() : "";
  const color = colorRaw.length > 0 ? colorRaw : "#64748b";
  const type = parseTransactionType(body.type);

  if (!workspace_id || !isUuid(workspace_id)) {
    return NextResponse.json({ error: "workspace_id phải là UUID hợp lệ." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "name không được để trống." }, { status: 400 });
  }
  if (!icon) {
    return NextResponse.json({ error: "icon không được để trống." }, { status: 400 });
  }
  if (!type) {
    return NextResponse.json({ error: "type phải là expense hoặc income." }, { status: 400 });
  }

  const row: CategoryInsert = {
    workspace_id,
    name,
    icon,
    color,
    type,
  };

  const { data, error } = await session.supabase.from("categories").insert([row]).select("*").single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ data }, { status: 201 });
}
