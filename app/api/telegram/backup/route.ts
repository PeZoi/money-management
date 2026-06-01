import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = userData.user.id;
  const userEmail = userData.user.email;

  // 1. Kiểm tra xem người dùng đã liên kết Telegram chưa
  const { data: connection, error: connError } = await supabase
    .from("user_telegram_connections")
    .select("telegram_chat_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 });
  }

  if (!connection || !connection.telegram_chat_id) {
    return NextResponse.json(
      { error: "Tài khoản chưa được kết nối với Telegram Bot." },
      { status: 400 }
    );
  }

  const telegramChatId = connection.telegram_chat_id;

  try {
    // 2. Lấy danh sách các workspace mà người dùng là thành viên chính thức
    const { data: memberWorkspaces, error: wsError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (wsError) {
      return NextResponse.json({ error: wsError.message }, { status: 500 });
    }

    const workspaceIds = memberWorkspaces?.map((w) => w.workspace_id) || [];

    if (workspaceIds.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu workspace nào để sao lưu." },
        { status: 400 }
      );
    }

    // 3. Truy vấn dữ liệu từ các bảng liên quan đến các workspace của user
    const [
      { data: workspaces },
      { data: accounts },
      { data: categories },
      { data: transactions },
    ] = await Promise.all([
      supabase.from("workspaces").select("*").in("id", workspaceIds),
      supabase.from("accounts").select("*").in("workspace_id", workspaceIds),
      supabase.from("categories").select("*").in("workspace_id", workspaceIds),
      supabase.from("transactions").select("*").in("workspace_id", workspaceIds),
    ]);

    // 4. Build payload dữ liệu backup
    const backupData = {
      version: "1.0",
      backup_at: new Date().toISOString(),
      app: "Money+",
      user: {
        id: userId,
        email: userEmail,
      },
      workspaces: workspaces || [],
      accounts: accounts || [],
      categories: categories || [],
      transactions: transactions || [],
    };

    // 5. Gửi file JSON qua Telegram Bot API (sendDocument)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram Bot Token chưa được cấu hình ở Server." },
        { status: 500 }
      );
    }

    const fileName = `money_backup_${new Date().toISOString().split("T")[0]}.json`;
    const backupStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupStr], { type: "application/json" });

    const formData = new FormData();
    formData.append("chat_id", telegramChatId.toString());
    formData.append("document", blob, fileName);
    formData.append(
      "caption",
      `💾 <b>Bản sao lưu dữ liệu Money+</b>\n\n` +
        `• <b>Thời gian:</b> ${new Date().toLocaleString("vi-VN")}\n` +
        `• <b>Workspace:</b> ${workspaces?.length || 0}\n` +
        `• <b>Tài khoản/Ví:</b> ${accounts?.length || 0}\n` +
        `• <b>Giao dịch:</b> ${transactions?.length || 0}\n\n` +
        `<i>⚠️ Đây là file chứa dữ liệu chi tiêu cá nhân của riêng bạn. Hãy lưu trữ an toàn và tuyệt đối không chia sẻ cho bất kỳ ai.</i>`
    );
    formData.append("parse_mode", "HTML");

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API Error response:", errorText);
      return NextResponse.json(
        { error: `Không thể gửi file qua Telegram: ${errorText}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Backup trigger error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
