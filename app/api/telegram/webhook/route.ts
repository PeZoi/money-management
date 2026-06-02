import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTransactionWithAI } from "@/lib/utils/ai-parser-server";

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


// Lấy path ảnh đại diện Telegram của người dùng
async function getTelegramUserAvatarPath(userId: number): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const photosRes = await fetch(
      `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${userId}&limit=1`
    );
    if (!photosRes.ok) return null;
    const photosData = await photosRes.json();
    if (!photosData.ok || !photosData.result || photosData.result.total_count === 0) {
      return null;
    }

    const photoSizes = photosData.result.photos[0];
    if (!photoSizes || photoSizes.length === 0) return null;

    // Lấy ảnh có kích thước nhỏ nhất/vừa phải để làm avatar (index 0)
    const fileId = photoSizes[0].file_id;

    // Gọi getFile để lấy file_path tải từ CDN Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    if (!fileRes.ok) return null;
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result || !fileData.result.file_path) {
      return null;
    }

    return fileData.result.file_path;
  } catch (err) {
    console.error("Lỗi lấy avatar Telegram:", err);
    return null;
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
    const fromId = message.from?.id;
    const username = message.from?.username || null;
    const firstName = message.from?.first_name || "";
    const lastName = message.from?.last_name || "";
    // Ghép First Name + Last Name, nếu trống dùng Username, cuối cùng mặc định Telegram User
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || username || "Telegram User";

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

      // Lấy đường dẫn avatar của người dùng nếu có id người gửi
      let avatarPath = null;
      if (fromId) {
        avatarPath = await getTelegramUserAvatarPath(fromId);
      }

      // Lưu kết nối Telegram và xóa token
      const { error: updateError } = await supabaseAdmin
        .from("user_telegram_connections")
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          telegram_display_name: displayName,
          telegram_avatar_path: avatarPath,
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
    } else if (/^\/(giaodich|gd)\b/i.test(text)) {
      // Xử lý lệnh ghi chép nhanh giao dịch qua AI
      const content = text.replace(/^\/(giaodich|gd)\s*/i, "").trim();

      if (!content) {
        await sendTelegramMessage(
          chatId,
          "⚠️ <b>Thiếu nội dung mô tả giao dịch!</b>\n\nVui lòng nhập theo cú pháp: <code>/gd &lt;số tiền&gt; &lt;mô tả&gt;</code>\nVí dụ: <code>/gd 30k ăn sáng</code>"
        );
        return NextResponse.json({ ok: true });
      }

      const supabaseAdmin = createAdminClient();

      // 1. Xác định người dùng thông qua telegram_chat_id
      const { data: connection, error: connError } = await supabaseAdmin
        .from("user_telegram_connections")
        .select("user_id")
        .eq("telegram_chat_id", chatId)
        .maybeSingle();

      if (connError || !connection) {
        await sendTelegramMessage(
          chatId,
          "❌ <b>Tài khoản Telegram này chưa được kết nối với Money+.</b>\n\nVui lòng đăng nhập vào website ứng dụng, đi tới <b>Cài đặt > Sao lưu dữ liệu</b> để kết nối tài khoản."
        );
        return NextResponse.json({ ok: true });
      }

      const userId = connection.user_id;

      // 2. Tìm Workspace cá nhân của người dùng
      const { data: personalWorkspace, error: wsError } = await supabaseAdmin
        .from("workspaces")
        .select("id")
        .eq("created_by", userId)
        .eq("is_personal", true)
        .maybeSingle();

      if (wsError || !personalWorkspace) {
        await sendTelegramMessage(
          chatId,
          "❌ <b>Không tìm thấy Workspace cá nhân của bạn.</b>\n\nVui lòng kiểm tra lại tài khoản trên website."
        );
        return NextResponse.json({ ok: true });
      }

      const workspaceId = personalWorkspace.id;

      // 3. Lấy danh sách danh mục (categories) thuộc Workspace
      const { data: categories } = await supabaseAdmin
        .from("categories")
        .select("id, name, type, icon")
        .eq("workspace_id", workspaceId);

      const categoriesList = categories || [];

      // 4. Lấy tài khoản mặc định (active) của workspace cá nhân
      let { data: account } = await supabaseAdmin
        .from("accounts")
        .select("id, name, icon")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .maybeSingle();

      // Nếu không có tài khoản nào hoạt động, lấy tài khoản đầu tiên được tạo
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

      // Nếu hoàn toàn chưa có tài khoản nào, tự động tạo tài khoản mặc định "Tiền mặt"
      if (!account) {
        const { data: newAccount, error: createAccError } = await supabaseAdmin
          .from("accounts")
          .insert({
            workspace_id: workspaceId,
            name: "Tiền mặt",
            type: "cash",
            balance: 0,
            currency: "VND",
            icon: "💰",
            color: "#6366f1",
            is_active: true,
            created_by: userId,
          })
          .select("id, name, icon")
          .single();

        if (createAccError || !newAccount) {
          await sendTelegramMessage(
            chatId,
            "❌ <b>Không thể lấy hoặc tạo tài khoản mặc định.</b>\n\nVui lòng kiểm tra lại tài khoản của bạn trên website."
          );
          return NextResponse.json({ ok: true });
        }

        account = newAccount;
      }

      const accountId = account.id;
      const accountName = account.name;
      const accountIcon = account.icon || "💳";

      // 5. Gọi AI phân tích mô tả giao dịch
      let parsedData;
      try {
        parsedData = await parseTransactionWithAI(content, categoriesList);
      } catch (parseErr) {
        console.error("AI parsing error in telegram webhook:", parseErr);
        await sendTelegramMessage(
          chatId,
          "❌ <b>Lỗi dịch vụ AI:</b> Hiện tại không thể phân tích giao dịch bằng AI. Vui lòng thử lại sau."
        );
        return NextResponse.json({ ok: true });
      }

      if (!parsedData || parsedData.amount <= 0) {
        await sendTelegramMessage(
          chatId,
          "❓ <b>Tôi không nhận diện được số tiền hoặc loại giao dịch hợp lệ.</b>\n\nVui lòng ghi rõ ràng số tiền và mô tả, ví dụ:\n- <code>/gd ăn trưa 35k</code>\n- <code>/gd xăng xe 50.000đ</code>\n- <code>/gd lương 15 triệu</code>"
        );
        return NextResponse.json({ ok: true });
      }

      // 6. Tìm category_id phù hợp trong DB
      let categoryId: string | null = null;
      let categoryName: string = parsedData.category_suggestion;
      let categoryIcon: string = "🏷️";

      if (parsedData.category_suggestion && parsedData.category_suggestion !== "Khác") {
        const matchCat = categoriesList.find(
          (c) =>
            c.name.toLowerCase().trim() === parsedData.category_suggestion.toLowerCase().trim() &&
            c.type === parsedData.type
        );
        if (matchCat) {
          categoryId = matchCat.id;
          categoryName = matchCat.name;
          categoryIcon = matchCat.icon || "🏷️";
        } else {
          const otherCat = categoriesList.find(
            (c) => c.name.toLowerCase().trim() === "khác" && c.type === parsedData.type
          );
          if (otherCat) {
            categoryId = otherCat.id;
            categoryName = otherCat.name;
            categoryIcon = otherCat.icon || "🏷️";
          }
        }
      } else {
        const otherCat = categoriesList.find(
          (c) => c.name.toLowerCase().trim() === "khác" && c.type === parsedData.type
        );
        if (otherCat) {
          categoryId = otherCat.id;
          categoryName = otherCat.name;
          categoryIcon = otherCat.icon || "🏷️";
        }
      }

      // 7. Tạo bản ghi giao dịch mới trong DB
      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .insert({
          workspace_id: workspaceId,
          amount: parsedData.amount,
          type: parsedData.type,
          category_id: categoryId,
          account_id: accountId,
          note: parsedData.clean_note,
          created_by: userId,
        });

      if (txError) {
        console.error("Save transaction from telegram error:", txError);
        let errMsg = "Không thể lưu giao dịch vào cơ sở dữ liệu.";
        if (txError.message.includes("numeric field overflow")) {
          errMsg = "Số tiền vượt quá giới hạn hệ thống.";
        }
        await sendTelegramMessage(
          chatId,
          `❌ <b>Lỗi lưu giao dịch:</b> ${errMsg}`
        );
        return NextResponse.json({ ok: true });
      }

      // 8. Trả lời xác nhận thành công
      const typeLabel = parsedData.type === "expense" ? "Chi tiêu 💸" : "Thu nhập 💰";
      const formattedAmount = parsedData.amount.toLocaleString("vi-VN") + " ₫";
      
      const successMsg = `✅ <b>Ghi chép giao dịch thành công!</b>\n\n` +
        `• 📌 <b>Loại:</b> ${typeLabel}\n` +
        `• 💵 <b>Số tiền:</b> <code>${formattedAmount}</code>\n` +
        `• 📝 <b>Nội dung:</b> ${parsedData.clean_note}\n` +
        `• ${categoryIcon} <b>Danh mục:</b> ${categoryName}\n` +
        `• ${accountIcon} <b>Tài khoản:</b> ${accountName}`;

      await sendTelegramMessage(chatId, successMsg);
    } else {
      // Tin nhắn thông thường khác (không bắt đầu bằng /gd hay /giaodich)
      await sendTelegramMessage(
        chatId,
        "🤖 <b>Money+ Bot</b>\n\nĐể ghi chép nhanh giao dịch, vui lòng sử dụng cú pháp:\n<code>/gd &lt;mô tả giao dịch&gt;</code> hoặc <code>/giaodich &lt;mô tả giao dịch&gt;</code>\n\n<i>Ví dụ: /gd ăn sáng 30k, /giaodich nhận lương 10tr</i>"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook handler error:", error);
    return NextResponse.json({ ok: true }); // Vẫn trả về 200 để Telegram không spam retry
  }
}

