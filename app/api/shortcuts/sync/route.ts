import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseSmsExpenseWithAI } from "@/lib/utils/ai-parser-server";

export async function POST(req: Request) {
  try {
    // 1. Trích xuất API Key từ Headers hoặc URL Search Params hoặc Body
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const headerKey = req.headers.get("x-api-key");
    const queryKey = url.searchParams.get("key");

    let apiKey = headerKey || queryKey;
    if (!apiKey && authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.replace("Bearer ", "").trim();
    }

    // Đọc body của request
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Cho phép request gửi dạng text thô
      body = {};
    }

    if (!apiKey && typeof body.key === "string") {
      apiKey = body.key;
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu API Key xác thực. Vui lòng truyền header x-api-key hoặc tham số ?key=...",
        },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 2. Xác định Người dùng từ API Key
    let userId: string | null = null;

    // Tìm trong bảng user_shortcut_keys
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("user_shortcut_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (!keyError && keyData?.user_id) {
      userId = keyData.user_id;
    } else {
      // Fallback 1: Tìm user từ user_metadata của auth.users
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
        const matchedUser = usersData?.users?.find(
          (u) => u.user_metadata?.shortcut_api_key === apiKey || u.id === apiKey
        );
        if (matchedUser) {
          userId = matchedUser.id;
        }
      } catch (authListErr) {
        console.warn("Không thể listUsers từ auth admin:", authListErr);
      }

      // Fallback 2: Kiểm tra xem key có trùng với user_id UUID trong workspaces không
      if (!userId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(apiKey)) {
          const { data: wsOwner } = await supabaseAdmin
            .from("workspaces")
            .select("created_by")
            .eq("created_by", apiKey)
            .limit(1)
            .maybeSingle();

          if (wsOwner?.created_by) {
            userId = wsOwner.created_by;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "API Key không hợp lệ hoặc không tồn tại.",
        },
        { status: 401 }
      );
    }

    // 3. Đọc dữ liệu đầu vào: SMS và Note
    const sms =
      typeof body.sms === "string"
        ? body.sms
        : typeof body.message === "string"
        ? body.message
        : typeof body.text === "string"
        ? body.text
        : "";

    const userNote = typeof body.note === "string" ? body.note : "";

    if (!sms.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Thiếu nội dung tin nhắn ngân hàng (sms).",
        },
        { status: 400 }
      );
    }

    // 4. Lấy Workspace cá nhân của người dùng
    const { data: personalWorkspace, error: wsError } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("created_by", userId)
      .eq("is_personal", true)
      .maybeSingle();

    let workspaceId = personalWorkspace?.id;

    if (!workspaceId) {
      // Fallback về Workspace đầu tiên mà user sở hữu
      const { data: anyWorkspace } = await supabaseAdmin
        .from("workspaces")
        .select("id")
        .eq("created_by", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      workspaceId = anyWorkspace?.id;
    }

    if (wsError || !workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Không tìm thấy Workspace cá nhân của bạn để ghi nhận giao dịch.",
        },
        { status: 404 }
      );
    }

    // 5. Lấy danh sách danh mục chi tiêu (type = "expense") của Workspace
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name, type, icon")
      .eq("workspace_id", workspaceId)
      .eq("type", "expense");

    const expenseCategories = categories || [];

    // 6. Lấy tài khoản đang active (is_active = true) để trừ tiền
    let { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id, name, icon")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .maybeSingle();

    // Nếu không có tài khoản active, lấy tài khoản đầu tiên
    if (!account) {
      const { data: fallbackAccount } = await supabaseAdmin
        .from("accounts")
        .select("id, name, icon")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      account = fallbackAccount;
    }

    // Nếu chưa có tài khoản nào, tự động tạo tài khoản mặc định
    if (!account) {
      const { data: newAccount, error: createAccError } = await supabaseAdmin
        .from("accounts")
        .insert({
          workspace_id: workspaceId,
          name: "Tài khoản chính",
          type: "cash",
          balance: 0,
          currency: "VND",
          icon: "💳",
          color: "#059669",
          is_active: true,
          created_by: userId,
        })
        .select("id, name, icon")
        .single();

      if (createAccError || !newAccount) {
        return NextResponse.json(
          {
            success: false,
            message: "Không thể tạo tài khoản mặc định để trừ tiền.",
          },
          { status: 500 }
        );
      }

      account = newAccount;
    }

    const accountId = account.id;
    const accountName = account.name;
    const accountIcon = account.icon || "💳";

    // 7. Gọi AI bóc tách SMS và ghi chú
    const parsedData = await parseSmsExpenseWithAI({
      sms,
      note: userNote,
      categories: expenseCategories,
    });

    if (!parsedData || parsedData.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Không nhận diện được số tiền chi tiêu hợp lệ từ tin nhắn SMS.",
        },
        { status: 422 }
      );
    }

    if (parsedData.amount > 9999999999999) {
      return NextResponse.json(
        {
          success: false,
          message: "Số tiền giao dịch quá lớn vượt quá giới hạn hệ thống.",
        },
        { status: 400 }
      );
    }

    // 8. Khớp Category ID từ gợi ý của AI
    let categoryId: string | null = null;
    let categoryName = parsedData.category_suggestion;
    let categoryIcon = "🏷️";

    if (parsedData.category_suggestion && parsedData.category_suggestion !== "Khác") {
      const matchCat = expenseCategories.find(
        (c) => c.name.toLowerCase().trim() === parsedData.category_suggestion.toLowerCase().trim()
      );
      if (matchCat) {
        categoryId = matchCat.id;
        categoryName = matchCat.name;
        categoryIcon = matchCat.icon || "🏷️";
      }
    }

    // Nếu không khớp hoặc là "Khác", tìm danh mục "Khác" trong hệ thống
    if (!categoryId) {
      const otherCat = expenseCategories.find(
        (c) => c.name.toLowerCase().trim() === "khác" || c.name.toLowerCase().trim() === "chi tiêu khác"
      );
      if (otherCat) {
        categoryId = otherCat.id;
        categoryName = otherCat.name;
        categoryIcon = otherCat.icon || "🏷️";
      } else if (expenseCategories.length > 0) {
        // Fallback về danh mục đầu tiên
        categoryId = expenseCategories[0].id;
        categoryName = expenseCategories[0].name;
        categoryIcon = expenseCategories[0].icon || "🏷️";
      }
    }

    // 9. Xác định ngày giờ giao dịch
    let transactionDate = new Date().toISOString();
    if (parsedData.transaction_date) {
      const parsedDate = new Date(parsedData.transaction_date);
      if (!isNaN(parsedDate.getTime())) {
        transactionDate = parsedDate.toISOString();
      }
    }

    // 10. Lưu bản ghi vào bảng transactions
    // Luôn luôn là type: "expense" (Chi tiêu) theo đúng yêu cầu
    const { data: newTx, error: txError } = await supabaseAdmin
      .from("transactions")
      .insert({
        workspace_id: workspaceId,
        amount: parsedData.amount,
        type: "expense", // Chắc chắn luôn là Chi tiêu
        category_id: categoryId,
        account_id: accountId,
        note: parsedData.clean_note,
        created_at: transactionDate,
        created_by: userId,
      })
      .select("id, amount, note, created_at")
      .single();

    if (txError) {
      console.error("Lỗi khi lưu giao dịch từ iOS Shortcuts:", txError);
      return NextResponse.json(
        {
          success: false,
          message: txError.message.includes("numeric field overflow")
            ? "Số tiền vượt quá giới hạn hệ thống."
            : "Lỗi lưu giao dịch vào cơ sở dữ liệu.",
        },
        { status: 500 }
      );
    }

    const formattedAmount = `${parsedData.amount.toLocaleString("vi-VN")} ₫`;
    const message = `Đã ghi nhận chi tiêu: ${parsedData.clean_note} - ${formattedAmount} (${categoryName}) trừ vào ${accountName}`;

    return NextResponse.json({
      success: true,
      message,
      data: {
        id: newTx.id,
        amount: parsedData.amount,
        formatted_amount: formattedAmount,
        type: "expense",
        category: categoryName,
        category_icon: categoryIcon,
        account: accountName,
        account_icon: accountIcon,
        note: parsedData.clean_note,
        date: transactionDate,
      },
    });
  } catch (error) {
    console.error("Lỗi trong POST /api/shortcuts/sync:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi hệ thống khi xử lý giao dịch tự động.",
      },
      { status: 500 }
    );
  }
}
