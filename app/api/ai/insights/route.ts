import { NextResponse } from "next/server";
import { subMonths, startOfDay } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { generateInsightsWithAI } from "@/lib/utils/ai-insights-server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/**
 * POST /api/ai/insights
 * Body: { workspace_id: string, months: number }
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    // 1. Xác thực người dùng đã đăng nhập
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const { workspace_id, months = 1 } = body;

    if (!isUuid(workspace_id)) {
      return NextResponse.json(
        { error: "workspace_id không hợp lệ." },
        { status: 400 }
      );
    }

    // 3. Kiểm tra xem người dùng có phải thành viên của workspace không
    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập workspace này." },
        { status: 403 }
      );
    }

    // 4. Lấy danh sách danh mục trong workspace
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("name, type")
      .eq("workspace_id", workspace_id);

    if (catError) {
      return NextResponse.json(
        { error: `Lỗi truy vấn danh mục: ${catError.message}` },
        { status: 500 }
      );
    }

    // 5. Xác định khoảng thời gian truy vấn giao dịch (1-3 tháng qua)
    const limitMonths = Math.min(Math.max(Number(months) || 1, 1), 3);
    const startDate = startOfDay(subMonths(new Date(), limitMonths)).toISOString();

    // 6. Truy vấn các giao dịch trong khoảng thời gian trên
    // Select cả category để có thông tin tên danh mục
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("workspace_id", workspace_id)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (txError) {
      return NextResponse.json(
        { error: `Lỗi truy vấn giao dịch: ${txError.message}` },
        { status: 500 }
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: "Không tìm thấy giao dịch nào trong khoảng thời gian đã chọn để phân tích."
      });
    }

    // 7. Gọi helper AI để tạo phân tích
    const insights = await generateInsightsWithAI(
      transactions,
      categories || [],
      limitMonths
    );

    return NextResponse.json({
      success: true,
      data: insights
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("[AI Insights Route Error]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
