import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

/**
 * Helper thực thi một tác vụ bất đồng bộ với cơ chế tự động thử lại (Retry with exponential backoff).
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; delayMs?: number; description?: string } = {}
): Promise<T> {
  const { retries = 3, delayMs = 1500, description = "Tác vụ" } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Debts Cron Retry] ${description} thất bại lần ${attempt}/${retries}: ${errMsg}`
      );
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
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
    // Và chưa được gửi thông báo (notified = false) - kèm retry chống Gateway Timeout
    const debts = await withRetry(
      async () => {
        const { data, error } = await supabaseAdmin
          .from("debts")
          .select("*")
          .eq("status", "pending")
          .eq("notified", false)
          .lte("due_at", new Date().toISOString());

        if (error) {
          throw new Error(`Truy vấn danh sách nợ thất bại: ${error.message}`);
        }
        return data || [];
      },
      { retries: 3, delayMs: 1500, description: "Quét danh sách nợ đến hạn" }
    );

    if (debts.length === 0) {
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

    const results: Array<{
      userId: string;
      status: string;
      reason?: string;
      error?: string;
      count?: number;
    }> = [];

    // 3. Với mỗi user, kiểm tra kết nối Telegram và gửi tin nhắn
    for (const userId of Object.keys(debtsByUser)) {
      const userDebts = debtsByUser[userId];

      // Lấy thông tin Telegram Connection của user (kèm retry)
      const conn = await withRetry(
        async () => {
          const { data, error } = await supabaseAdmin
            .from("user_telegram_connections")
            .select("telegram_chat_id, telegram_username")
            .eq("user_id", userId)
            .not("telegram_chat_id", "is", null)
            .maybeSingle();

          if (error) {
            throw new Error(`Truy vấn kết nối Telegram thất bại: ${error.message}`);
          }
          return data;
        },
        { retries: 2, delayMs: 1000, description: `Lấy thông tin Telegram cho user ${userId}` }
      );

      if (!conn || !conn.telegram_chat_id) {
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
        await withRetry(
          async () => {
            const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegramChatId.toString(),
                text: message,
                parse_mode: "HTML",
              }),
              signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Telegram API Error: ${errText}`);
            }
            return true;
          },
          { retries: 2, delayMs: 1500, description: `Gửi thông báo Telegram cho user ${userId}` }
        );

        // 5. Cập nhật notified = true trong database cho các khoản nợ của user này
        const debtIds = userDebts.map((d) => d.id);
        const { error: updateError } = await supabaseAdmin
          .from("debts")
          .update({ notified: true })
          .in("id", debtIds);

        if (updateError) {
          console.error(
            `[Debts Reminder Cron] Lỗi cập nhật trạng thái notified cho user ${userId}:`,
            updateError
          );
          results.push({
            userId,
            status: "partial_success",
            error: `Không thể đánh dấu đã thông báo: ${updateError.message}`,
          });
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
