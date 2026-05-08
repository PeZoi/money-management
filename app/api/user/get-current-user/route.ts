import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  mapSupabaseUserToSnapshot,
  mergeCurrentUserSnapshot,
} from "@/lib/auth/map-supabase-user";
import localStorageFn from "@/functions/localstorage-fn";

export async function GET() {
  const supabase = createClient();

  // `getUser()` đảm bảo user đã được xác thực (khác với chỉ đọc từ storage).
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 401 });
  }

  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = mapSupabaseUserToSnapshot(user);

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", base.id)
    .maybeSingle();

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  const currentUser = mergeCurrentUserSnapshot(base, {
    roleLabel: roleRow?.role ?? undefined,
  });

  return NextResponse.json({ data: currentUser });
}
