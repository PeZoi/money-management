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
    // 2. Lấy workspace cá nhân của người dùng
    const { data: personalWorkspace, error: wsError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("created_by", userId)
      .eq("is_personal", true)
      .maybeSingle();

    if (wsError) {
      return NextResponse.json({ error: wsError.message }, { status: 500 });
    }

    if (!personalWorkspace) {
      return NextResponse.json(
        { error: "Không tìm thấy dữ liệu workspace cá nhân để sao lưu." },
        { status: 404 }
      );
    }

    const workspaceId = personalWorkspace.id;

    // 3. Truy vấn dữ liệu từ các bảng liên quan đến workspace cá nhân
    const [
      { data: accounts },
      { data: categories },
      { data: transactions },
    ] = await Promise.all([
      supabase.from("accounts").select("*").eq("workspace_id", workspaceId),
      supabase.from("categories").select("*").eq("workspace_id", workspaceId),
      supabase.from("transactions").select("*").eq("workspace_id", workspaceId),
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
      workspace: personalWorkspace,
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
        `• <b>Loại dữ liệu:</b> Cá nhân\n` +
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
