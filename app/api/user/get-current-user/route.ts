import { NextResponse } from "next/server";

import {
  mapSupabaseUserToSnapshot,
  mergeCurrentUserSnapshot,
} from "@/lib/auth/map-supabase-user";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole, WorkspaceRow } from "@/types/database";

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

  // Fetch workspaces for the user
  const { data: workspacesData, error: workspacesError } = await supabase
    .from("workspace_members")
    .select(`
      role,
      workspaces (
        id,
        name,
        is_personal,
        is_archived,
        created_by
      )
    `)
    .eq("user_id", base.id)
    .eq("status", "accepted");

  if (workspacesError) {
    return NextResponse.json({ error: workspacesError.message }, { status: 500 });
  }

  type WorkspaceQueryResult = {
    role: WorkspaceRole;
    workspaces: (Pick<WorkspaceRow, "id" | "name" | "is_personal" | "created_by"> & { is_archived: boolean }) | null;
  };

  // Chỉ lấy các workspace hoạt động (không bị archived)
  const workspaces = (workspacesData as unknown as WorkspaceQueryResult[])
    ?.filter((w) => w.workspaces && !w.workspaces.is_archived)
    ?.map((w) => ({
      id: w.workspaces!.id,
      name: w.workspaces!.name,
      is_personal: w.workspaces!.is_personal,
      created_by: w.workspaces!.created_by,
      role: w.role,
    })) ?? [];

  const currentUser = mergeCurrentUserSnapshot(base, {
    roleLabel: roleRow?.role ?? undefined,
    workspaces,
  });

  return NextResponse.json({ data: currentUser });
}
