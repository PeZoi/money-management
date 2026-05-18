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
  { params }: { params: { id: string } }
) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const { id } = params;
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
