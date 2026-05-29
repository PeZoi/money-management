import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
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
 * POST /api/transactions/reset
 * Body: { workspace_id, range, value, keep_balance }
 */
export async function POST(req: Request) {
  const session = await requireUser();
  if (session.errorResponse) return session.errorResponse;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const workspace_id = isUuid(body.workspace_id) ? body.workspace_id : null;
  const range = typeof body.range === "string" ? body.range : null; // "all" | "day" | "month" | "year"
  const value = typeof body.value === "string" ? body.value.trim() : null;
  const keep_balance = typeof body.keep_balance === "boolean" ? body.keep_balance : true;

  if (!workspace_id) {
    return NextResponse.json({ error: "workspace_id phải là UUID hợp lệ." }, { status: 400 });
  }

  if (!range || !["all", "day", "month", "year"].includes(range)) {
    return NextResponse.json({ error: "range phải là 'all', 'day', 'month' hoặc 'year'." }, { status: 400 });
  }

  if (range !== "all" && !value) {
    return NextResponse.json({ error: "Thiếu giá trị mốc thời gian (value) cho phạm vi được chọn." }, { status: 400 });
  }

  // 1. Kiểm tra quyền sở hữu workspace cá nhân
  const { data: ws, error: wsError } = await session.supabase
    .from("workspaces")
    .select("is_personal, created_by")
    .eq("id", workspace_id)
    .maybeSingle();

  if (wsError) {
    return NextResponse.json({ error: wsError.message }, { status: 500 });
  }
  if (!ws) {
    return NextResponse.json({ error: "Workspace không tồn tại." }, { status: 404 });
  }
  if (!ws.is_personal || ws.created_by !== session.user.id) {
    return NextResponse.json(
      { error: "Bạn chỉ được phép reset giao dịch của Workspace cá nhân chính chủ." },
      { status: 403 }
    );
  }

  // 2. Lấy số dư hiện tại của tất cả tài khoản trong workspace nếu chọn keep_balance
  let savedBalances: { id: string; balance: number }[] = [];
  if (keep_balance) {
    const { data: accountsData, error: accountsError } = await session.supabase
      .from("accounts")
      .select("id, balance")
      .eq("workspace_id", workspace_id);

    if (accountsError) {
      return NextResponse.json({ error: accountsError.message }, { status: 500 });
    }
    savedBalances = (accountsData || []).map((acc) => ({
      id: acc.id,
      balance: Number(acc.balance || 0),
    }));
  }

  // 3. Xác định mốc thời gian lọc để xóa
  let gte: string | null = null;
  let lte: string | null = null;

  if (range === "day") {
    // value format: "YYYY-MM-DD"
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value!)) {
      return NextResponse.json({ error: "value cho range 'day' phải có định dạng YYYY-MM-DD" }, { status: 400 });
    }
    gte = new Date(`${value}T00:00:00.000Z`).toISOString();
    lte = new Date(`${value}T23:59:59.999Z`).toISOString();
  } else if (range === "month") {
    // value format: "YYYY-MM"
    if (!/^\d{4}-\d{2}$/.test(value!)) {
      return NextResponse.json({ error: "value cho range 'month' phải có định dạng YYYY-MM" }, { status: 400 });
    }
    const [year, month] = value!.split("-").map(Number);
    gte = new Date(year, month - 1, 1, 0, 0, 0, 0).toISOString();
    lte = new Date(year, month, 1, 0, 0, 0, 0).toISOString(); // Nhỏ hơn ngày 1 tháng tiếp theo
  } else if (range === "year") {
    // value format: "YYYY"
    if (!/^\d{4}$/.test(value!)) {
      return NextResponse.json({ error: "value cho range 'year' phải có định dạng YYYY" }, { status: 400 });
    }
    const year = Number(value);
    gte = new Date(year, 0, 1, 0, 0, 0, 0).toISOString();
    lte = new Date(year + 1, 0, 1, 0, 0, 0, 0).toISOString(); // Nhỏ hơn ngày 1 tháng 1 năm tiếp theo
  }

  // 4. Thực hiện xóa giao dịch
  let deleteQuery = session.supabase
    .from("transactions")
    .delete()
    .eq("workspace_id", workspace_id);

  if (range === "day") {
    deleteQuery = deleteQuery.gte("created_at", gte!).lte("created_at", lte!);
  } else if (range === "month" || range === "year") {
    deleteQuery = deleteQuery.gte("created_at", gte!).lt("created_at", lte!);
  }

  const { data: deletedRows, error: deleteError } = await deleteQuery.select("id");

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const deletedCount = deletedRows?.length || 0;

  // 5. Nếu chọn keep_balance và đã xóa thành công ít nhất 1 giao dịch, ghi đè phục hồi lại số dư ban đầu
  if (keep_balance && deletedCount > 0 && savedBalances.length > 0) {
    for (const acc of savedBalances) {
      const { error: updateAccError } = await session.supabase
        .from("accounts")
        .update({ balance: acc.balance })
        .eq("id", acc.id);

      if (updateAccError) {
        console.error(`Lỗi phục hồi số dư cho tài khoản ${acc.id}:`, updateAccError.message);
      }
    }
  }

  return NextResponse.json({
    success: true,
    deleted_count: deletedCount,
  });
}
