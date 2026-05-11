import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { CategoryUpdate, TransactionType } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parseTransactionType(value: unknown): TransactionType | null {
  if (value === "expense" || value === "income") return value;
  return null;
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

/** Chi tiết một danh mục: `GET /api/categories/<id>` */
export async function GET(_req: Request, context: RouteContext) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await context.params;
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: "id không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await session.supabase.from("categories").select("*").eq("id", id).maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy danh mục hoặc không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ data });
}

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

  const patch: CategoryUpdate = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name phải là chuỗi không rỗng." }, { status: 400 });
    }
    patch.name = body.name.trim();
  }
  if ("icon" in body) {
    if (typeof body.icon !== "string" || !body.icon.trim()) {
      return NextResponse.json({ error: "icon phải là chuỗi không rỗng." }, { status: 400 });
    }
    patch.icon = body.icon.trim();
  }
  if ("color" in body) {
    if (typeof body.color !== "string" || !body.color.trim()) {
      return NextResponse.json({ error: "color phải là chuỗi không rỗng." }, { status: 400 });
    }
    patch.color = body.color.trim();
  }
  if ("type" in body) {
    const t = parseTransactionType(body.type);
    if (!t) {
      return NextResponse.json({ error: "type phải là expense hoặc income." }, { status: 400 });
    }
    patch.type = t;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Không có trường nào để cập nhật." }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy danh mục hoặc không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await requireSessionUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = await context.params;
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: "id không hợp lệ." }, { status: 400 });
  }

  const { data, error } = await session.supabase.from("categories").delete().eq("id", id).select("id").maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Không tìm thấy danh mục hoặc không có quyền." }, { status: 404 });
  }

  return NextResponse.json({ data: { id: data.id } });
}
