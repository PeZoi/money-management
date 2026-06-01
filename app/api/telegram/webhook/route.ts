import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Gửi tin nhắn text qua Telegram Bot
async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      console.error("Failed to send Telegram message:", await response.text());
    }
  } catch (err) {
    console.error("Error in sendTelegramMessage:", err);
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const message = payload.message;

    // Phản hồi 200 OK ngay lập tức cho Telegram để tránh re-delivery
    if (!message || !message.text || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text.trim();
    const chatId = message.chat.id;
    const username = message.from?.username || message.from?.first_name || "User";

    // Xử lý lệnh /start chứa token liên kết
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length < 2) {
        await sendTelegramMessage(
          chatId,
          "👋 <b>Chào mừng bạn đến với Money+ Backup!</b>\n\nVui lòng truy cập trang <b>Cài đặt > Sao lưu dữ liệu</b> trên website ứng dụng để lấy link kết nối tài khoản của bạn."
        );
        return NextResponse.json({ ok: true });
      }

      const token = parts[1].trim();
      const supabaseAdmin = createAdminClient();

      // Kiểm tra token xem có khớp và chưa hết hạn
      const { data: connection, error: fetchError } = await supabaseAdmin
        .from("user_telegram_connections")
        .select("user_id, token_expires_at")
        .eq("connection_token", token)
        .maybeSingle();

      if (fetchError || !connection) {
        await sendTelegramMessage(
          chatId,
          "❌ <b>Mã liên kết không hợp lệ hoặc đã hết hạn.</b>\n\nVui lòng làm mới mã trên trang Cài đặt và thử lại."
        );
        return NextResponse.json({ ok: true });
      }

      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        await sendTelegramMessage(
          chatId,
          "❌ <b>Mã liên kết đã hết hạn (hiệu lực 10 phút).</b>\n\nVui lòng nhấn kết nối lại trên trang Cài đặt để tạo mã mới."
        );
        return NextResponse.json({ ok: true });
      }

      // Lưu kết nối Telegram và xóa token
      const { error: updateError } = await supabaseAdmin
        .from("user_telegram_connections")
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          connection_token: null, // Vô hiệu hoá token
        })
        .eq("user_id", connection.user_id);

      if (updateError) {
        console.error("Update connection error:", updateError);
        await sendTelegramMessage(
          chatId,
          "❌ <b>Đã có lỗi hệ thống xảy ra khi kết nối.</b> Vui lòng thử lại sau."
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(
        chatId,
        `🎉 <b>Liên kết thành công!</b>\n\nTài khoản Money+ của bạn đã được kết nối với tài khoản Telegram này.\n\nTừ bây giờ, bạn có thể sao lưu dữ liệu an toàn và nhận file backup trực tiếp tại đây.`
      );
    } else {
      // Tin nhắn thông thường khác
      await sendTelegramMessage(
        chatId,
        "🤖 <b>Money+ Backup Bot</b>\n\nTôi chỉ hỗ trợ gửi file sao lưu dữ liệu tự động hoặc theo yêu cầu trực tiếp từ trang web Money+."
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook handler error:", error);
    return NextResponse.json({ ok: true }); // Vẫn trả về 200 để Telegram không spam retry
  }
}
