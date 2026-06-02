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
    const fileSizeKb = (blob.size / 1024).toFixed(2);

    const formData = new FormData();
    formData.append("chat_id", telegramChatId.toString());
    formData.append("document", blob, fileName);
    formData.append(
      "caption",
      `🏦 <b>MONEY+ CLOUD BACKUP</b> 🏦\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `💾 <b>HỆ THỐNG SAO LƯU DỰ PHÒNG</b>\n\n` +
        `⚙️ <b>Phương thức:</b> ⚡ <b>Thủ công tức thời</b>\n` +
        `📅 <b>Thời gian:</b> <code>${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</code>\n` +
        `📂 <b>Dung lượng:</b> 💾 <code>${fileSizeKb} KB</code>\n` +
        `🔒 <b>Bảo mật:</b> 🛡️ Mã hóa cá nhân\n\n` +
        `📊 <b>THỐNG KÊ CHI TIẾT BẢN SAO LƯU:</b>\n` +
        `┌─────────────────────────\n` +
        `├─ 💳 <b>Tài khoản & Ví:</b> <code>${(accounts?.length || 0).toLocaleString("vi-VN")}</code> ví hoạt động\n` +
        `├─ 📂 <b>Danh mục thu chi:</b> <code>${(categories?.length || 0).toLocaleString("vi-VN")}</code> nhóm phân loại\n` +
        `└─ 📝 <b>Nhật ký giao dịch:</b> <code>${(transactions?.length || 0).toLocaleString("vi-VN")}</code> bản ghi phát sinh\n` +
        `└─────────────────────────\n\n` +
        `💡 <b>HƯỚNG DẪN KHÔI PHỤC DỮ LIỆU:</b>\n` +
        `1️⃣ Tải file đính kèm này về thiết bị của bạn.\n` +
        `2️⃣ Truy cập mục <b>Cài đặt > Sao lưu & Khôi phục</b>.\n` +
        `3️⃣ Kéo thả hoặc chọn file để tiến hành khôi phục tức thì.\n\n` +
        `⚠️ <i><b>Lưu ý quan trọng:</b> Bản sao lưu này chứa toàn bộ lịch sử thu chi cá nhân của bạn. Vui lòng lưu trữ an toàn và tuyệt đối KHÔNG chia sẻ tệp tin này cho bất kỳ ai.</i>\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
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
