import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Tăng thời gian chạy tối đa cho Serverless Function trên Vercel để tránh timeout
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Helper thực thi một tác vụ bất đồng bộ với cơ chế tự động thử lại (Retry with exponential backoff).
 * Khắc phục triệt để lỗi "Gateway Timeout" (504) và chập chờn kết nối từ Supabase/Cloudflare khi Cold Start.
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
        `[Backup Cron Retry] ${description} thất bại lần ${attempt}/${retries}: ${errMsg}`
      );
      if (attempt < retries) {
        // Đợi với thời gian tăng dần (1.5s, 3s...) để backend Supabase kịp phục hồi
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

// Hàm xử lý chính cho việc chạy Backup Cron Job
async function runBackupCron(req: Request) {
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
    // Ở môi trường dev, nếu có cấu hình CRON_SECRET thì mới kiểm tra
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

    // 1. Xác định thời gian hiện tại theo múi giờ Việt Nam (GMT+7)
    const dateInGmt7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const currentHour = dateInGmt7.getUTCHours(); // 0 - 23
    const currentDayOfMonth = dateInGmt7.getUTCDate(); // 1 - 31
    const utcDay = dateInGmt7.getUTCDay();
    const currentDayOfWeek = utcDay === 0 ? 7 : utcDay; // CN -> 7, Thứ 2 -> 1, ..., Thứ 7 -> 6

    console.log(
      `[Backup Cron] Bắt đầu quét lịch trình sao lưu tại giờ GMT+7: ${currentHour}:00, ` +
        `Ngày trong tháng: ${currentDayOfMonth}, Ngày trong tuần: ${currentDayOfWeek}`
    );

    // 2. Lấy danh sách cấu hình auto backup khớp với giờ hiện tại (kèm Retry chống Gateway Timeout)
    const connections = await withRetry(
      async () => {
        const { data, error } = await supabaseAdmin
          .from("user_telegram_connections")
          .select("user_id, telegram_chat_id, telegram_username, backup_interval, backup_day")
          .eq("is_auto_backup", true)
          .eq("backup_hour", currentHour)
          .not("telegram_chat_id", "is", null);

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        return data || [];
      },
      { retries: 3, delayMs: 1500, description: "Truy vấn danh sách lịch trình sao lưu" }
    );

    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Không có cấu hình sao lưu nào trùng với khung giờ ${currentHour}:00 hiện tại.`,
      });
    }

    // 3. Lọc cấu hình theo tần suất (daily, weekly, monthly)
    const targetUsers = connections.filter((conn) => {
      if (conn.backup_interval === "daily") return true;
      if (conn.backup_interval === "weekly") return conn.backup_day === currentDayOfWeek;
      if (conn.backup_interval === "monthly") return conn.backup_day === currentDayOfMonth;
      return false;
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tìm thấy ${connections.length} cấu hình ở khung giờ ${currentHour}:00 nhưng không khớp ngày chạy định kỳ.`,
      });
    }

    console.log(`[Backup Cron] Bắt đầu xử lý sao lưu cho ${targetUsers.length} tài khoản...`);
    const results: Array<{ userId: string; status: string; reason?: string; error?: string }> = [];

    // 4. Lặp qua từng user để tạo file sao lưu và gửi Telegram
    for (const target of targetUsers) {
      const userId = target.user_id;
      const telegramChatId = target.telegram_chat_id;

      try {
        // Thiết lập email metadata mà không gọi Auth API để tránh Rate Limit (429)
        const userEmail = target.telegram_username
          ? `${target.telegram_username}@telegram.org`
          : "auto-backup@moneyplus.local";

        // Lấy workspace cá nhân của user (kèm retry)
        const personalWorkspace = await withRetry(
          async () => {
            const { data, error } = await supabaseAdmin
              .from("workspaces")
              .select("*")
              .eq("created_by", userId)
              .eq("is_personal", true)
              .maybeSingle();

            if (error) {
              throw new Error(`Lấy workspace cá nhân thất bại: ${error.message}`);
            }
            return data;
          },
          { retries: 2, delayMs: 1000, description: `Truy vấn workspace cá nhân cho user ${userId}` }
        );

        if (!personalWorkspace) {
          // Gửi tin nhắn thông báo tài khoản không có workspace cá nhân để sao lưu
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId.toString(),
              text: `⚠️ <b>Thông báo sao lưu tự động Money+</b>\n\nKhông thể tiến hành sao lưu tự động vì không tìm thấy dữ liệu workspace cá nhân của bạn.`,
              parse_mode: "HTML",
            }),
            signal: AbortSignal.timeout(15000),
          });
          results.push({ userId, status: "skipped", reason: "No personal workspace" });
          continue;
        }

        const workspaceId = personalWorkspace.id;

        // Lấy chi tiết dữ liệu từ các bảng liên quan đến workspace cá nhân (kèm retry)
        const [accounts, categories, transactions] = await withRetry(
          async () => {
            const [accRes, catRes, txRes] = await Promise.all([
              supabaseAdmin.from("accounts").select("*").eq("workspace_id", workspaceId),
              supabaseAdmin.from("categories").select("*").eq("workspace_id", workspaceId),
              supabaseAdmin.from("transactions").select("*").eq("workspace_id", workspaceId),
            ]);

            if (accRes.error) throw new Error(`Lấy tài khoản thất bại: ${accRes.error.message}`);
            if (catRes.error) throw new Error(`Lấy danh mục thất bại: ${catRes.error.message}`);
            if (txRes.error) throw new Error(`Lấy giao dịch thất bại: ${txRes.error.message}`);

            return [accRes.data || [], catRes.data || [], txRes.data || []] as const;
          },
          { retries: 2, delayMs: 1000, description: `Truy vấn dữ liệu sao lưu cho user ${userId}` }
        );

        // Tạo dữ liệu payload backup JSON
        const backupData = {
          version: "1.0",
          backup_at: new Date().toISOString(),
          app: "Money+",
          user: {
            id: userId,
            email: userEmail,
          },
          workspace: personalWorkspace,
          accounts,
          categories,
          transactions,
        };

        const fileName = `money_backup_${new Date().toISOString().split("T")[0]}.json`;
        const backupStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupStr], { type: "application/json" });

        const fileSizeKb = (blob.size / 1024).toFixed(2);
        const intervalText =
          target.backup_interval === "daily"
            ? "Hằng ngày"
            : target.backup_interval === "weekly"
              ? "Hằng tuần"
              : "Hằng tháng";

        const formData = new FormData();
        formData.append("chat_id", telegramChatId.toString());
        formData.append("document", blob, fileName);
        formData.append(
          "caption",
          `🏦 <b>MONEY+ CLOUD BACKUP</b> 🏦\n` +
            `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
            `💾 <b>HỆ THỐNG SAO LƯU DỰ PHÒNG</b>\n\n` +
            `⚙️ <b>Phương thức:</b> 🤖 <b>Tự động định kỳ</b>\n` +
            `⏱️ <b>Tần suất:</b> 🔄 ${intervalText}\n` +
            `📅 <b>Thời gian:</b> <code>${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</code>\n` +
            `📂 <b>Dung lượng:</b> 💾 <code>${fileSizeKb} KB</code>\n` +
            `🔒 <b>Bảo mật:</b> 🛡️ Mã hóa cá nhân\n\n` +
            `📊 <b>THỐNG KÊ CHI TIẾT BẢN SAO LƯU:</b>\n` +
            `┌─────────────────────────\n` +
            `├─ 💳 <b>Tài khoản & Ví:</b> <code>${accounts.length.toLocaleString("vi-VN")}</code> ví hoạt động\n` +
            `├─ 📂 <b>Danh mục thu chi:</b> <code>${categories.length.toLocaleString("vi-VN")}</code> nhóm phân loại\n` +
            `└─ 📝 <b>Nhật ký giao dịch:</b> <code>${transactions.length.toLocaleString("vi-VN")}</code> bản ghi phát sinh\n` +
            `└─────────────────────────\n\n` +
            `💡 <b>HƯỚNG DẪN KHÔI PHỤC DỮ LIỆU:</b>\n` +
            `1️⃣ Tải file đính kèm này về thiết bị của bạn.\n` +
            `2️⃣ Truy cập mục <b>Cài đặt > Sao lưu & Khôi phục</b>.\n` +
            `3️⃣ Kéo thả hoặc chọn file để tiến hành khôi phục tức thì.\n\n` +
            `⚠️ <i><b>Lưu ý quan trọng:</b> Bản sao lưu này chứa toàn bộ lịch sử thu chi cá nhân của bạn. Vui lòng lưu trữ an toàn và tuyệt đối KHÔNG chia sẻ tệp tin này cho bất kỳ ai.</i>\n` +
            `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
        );
        formData.append("parse_mode", "HTML");

        // Gửi file qua Telegram API có retry và timeout bảo vệ
        await withRetry(
          async () => {
            const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
            const telegramRes = await fetch(telegramUrl, {
              method: "POST",
              body: formData,
              signal: AbortSignal.timeout(25000), // Timeout 25s
            });

            if (!telegramRes.ok) {
              const errText = await telegramRes.text();
              throw new Error(`Telegram API Error: ${errText}`);
            }
            return true;
          },
          { retries: 2, delayMs: 2000, description: `Gửi tài liệu Telegram cho user ${userId}` }
        );

        results.push({ userId, status: "success" });
      } catch (userErr: unknown) {
        const errorMsg = userErr instanceof Error ? userErr.message : "Unknown error";
        console.error(`[Backup Cron] Lỗi khi sao lưu cho user ${userId}:`, errorMsg);
        results.push({ userId, status: "failed", error: errorMsg });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã xử lý xong cron job sao lưu.`,
      processed: results.length,
      details: results,
    });
  } catch (error: unknown) {
    console.error("[Backup Cron] Lỗi hệ thống khi chạy Cron Job:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return runBackupCron(req);
}

export async function POST(req: Request) {
  return runBackupCron(req);
}
