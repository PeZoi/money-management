import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper kiểm tra quyền admin cho API route.
 * Trả về supabase client + user nếu hợp lệ, hoặc errorResponse nếu bị từ chối.
 */
export async function requireAdmin() {
  const supabase = createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      supabase,
      user: null as null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Kiểm tra user có role admin trong bảng user_roles
  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("requireAdmin: Lỗi khi truy vấn vai trò admin:", roleError.message);
  }

  if (roleError || roleRow?.role !== "admin") {
    return {
      supabase,
      user: null as null,
      errorResponse: NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 }),
    };
  }

  return { supabase, user, errorResponse: null as null };
}
