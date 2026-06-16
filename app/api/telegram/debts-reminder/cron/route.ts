import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Hàm helper format tiền tệ VND
function formatVnd(amount: number | string) {
  const numeric = Number(amount);
  if (isNaN(numeric)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(numeric);
}

// Hàm helper format ngày dd/MM/yyyy
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Hàm tính số ngày trễ hoặc số ngày còn lại đến hạn
function getDueDaysText(dueAtStr: string) {
  const now = new Date();
  // Đặt về 0h 0m 0s để tính toán chính xác số ngày
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const due = new Date(dueAtStr);
  const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Đến hạn hôm nay ⚠️";
  } else if (diffDays < 0) {
    return `Quá hạn ${Math.abs(diffDays)} ngày 🚨`;
  } else {
    return `Còn ${diffDays} ngày nữa ⏳`;
  }
}

async function runDebtsReminderCron(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Xác thực request
  if (process.env.NODE_ENV === "production") {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Missing or invalid CRON_SECRET" },
        { status: 401 }
      );
    }
  } else {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid CRON_SECRET in Development" },
        { status: 401 }
      );
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { success: false, message: "Telegram Bot Token chưa được cấu hình ở Server" },
      { status: 500 }
    );
  }

  try {
    const supabaseAdmin = createAdminClient();

    // 1. Quét các khoản nợ có trạng thái chưa trả (pending), đã đến hạn/quá hạn (due_at <= ngày hiện tại)
    // Và chưa được gửi thông báo (notified = false)
    const { data: debts, error: debtsError } = await supabaseAdmin
      .from("debts")
      .select("*")
      .eq("status", "pending")
      .eq("notified", false)
      .lte("due_at", new Date().toISOString());

    if (debtsError) {
      console.error("[Debts Reminder Cron] Lỗi truy vấn nợ:", debtsError);
      return NextResponse.json({ success: false, message: debtsError.message }, { status: 500 });
    }

    if (!debts || debts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có khoản nợ nào cần gửi thông báo nhắc nhở.",
      });
    }

    console.log(`[Debts Reminder Cron] Tìm thấy ${debts.length} khoản nợ cần xử lý thông báo.`);

    // 2. Gom nhóm các khoản nợ theo user_id (created_by)
    const debtsByUser: Record<string, typeof debts> = {};
    for (const debt of debts) {
      const userId = debt.created_by;
      if (!debtsByUser[userId]) {
        debtsByUser[userId] = [];
      }
      debtsByUser[userId].push(debt);
    }

    const results = [];

    // 3. Với mỗi user, kiểm tra kết nối Telegram và gửi tin nhắn
    for (const userId of Object.keys(debtsByUser)) {
      const userDebts = debtsByUser[userId];

      // Lấy thông tin Telegram Connection của user
      const { data: conn, error: connError } = await supabaseAdmin
        .from("user_telegram_connections")
        .select("telegram_chat_id, telegram_username")
        .eq("user_id", userId)
        .not("telegram_chat_id", "is", null)
        .maybeSingle();

      if (connError) {
        console.error(`[Debts Reminder Cron] Lỗi truy vấn telegram connection cho user ${userId}:`, connError);
        results.push({ userId, status: "failed", error: connError.message });
        continue;
      }

      if (!conn || !conn.telegram_chat_id) {
        // Người dùng chưa kết nối Telegram, bỏ qua và không gửi thông báo
        results.push({ userId, status: "skipped", reason: "Chưa kết nối Telegram" });
        continue;
      }

      const telegramChatId = conn.telegram_chat_id;

      // Xây dựng nội dung tin nhắn HTML
      let message = `🔔 <b>MONEY+ NHẮC NHỞ HẠN TRẢ NỢ</b> 🔔\n`;
      message += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
      message += `Chào bạn, hệ thống ghi nhận bạn có <b>${userDebts.length}</b> khoản nợ cần thu hồi đã đến hạn hoặc quá hạn trả:\n\n`;

      userDebts.forEach((debt, index) => {
        message += `👤 <b>Người nợ:</b> <code>${debt.debtor_name}</code>\n`;
        message += `💰 <b>Số tiền:</b> <b>${formatVnd(debt.amount)}</b>\n`;
        message += `📅 <b>Ngày mượn:</b> <code>${formatDate(debt.borrowed_at)}</code>\n`;
        message += `⏳ <b>Hạn trả:</b> <code>${formatDate(debt.due_at)}</code> (${getDueDaysText(debt.due_at)})\n`;
        if (debt.note) {
          message += `📝 <b>Ghi chú:</b> <i>${debt.note}</i>\n`;
        }
        if (index < userDebts.length - 1) {
          message += `──────────────────\n`;
        }
      });

      message += `\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
      message += `💡 <i>Hãy liên hệ với người nợ để thu hồi khoản tiền này nhé! Bạn có thể cập nhật trạng thái đã trả trên ứng dụng Money+.</i>`;

      // 4. Gửi tin nhắn qua Telegram Bot
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId.toString(),
            text: message,
            parse_mode: "HTML",
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Telegram API Error: ${errText}`);
        }

        // 5. Cập nhật notified = true trong database cho các khoản nợ của user này
        const debtIds = userDebts.map((d) => d.id);
        const { error: updateError } = await supabaseAdmin
          .from("debts")
          .update({ notified: true })
          .in("id", debtIds);

        if (updateError) {
          console.error(`[Debts Reminder Cron] Lỗi cập nhật trạng thái notified cho user ${userId}:`, updateError);
          results.push({ userId, status: "partial_success", error: `Không thể đánh dấu đã thông báo: ${updateError.message}` });
        } else {
          results.push({ userId, status: "success", count: userDebts.length });
        }
      } catch (tgErr: unknown) {
        const errMsg = tgErr instanceof Error ? tgErr.message : "Unknown TG error";
        console.error(`[Debts Reminder Cron] Gửi Telegram lỗi cho user ${userId}:`, errMsg);
        results.push({ userId, status: "failed", error: errMsg });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Đã xử lý xong nhắc nhở nợ.",
      details: results,
    });
  } catch (error: unknown) {
    console.error("[Debts Reminder Cron] Lỗi hệ thống khi chạy Cron Job:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return runDebtsReminderCron(req);
}

export async function POST(req: Request) {
  return runDebtsReminderCron(req);
}
