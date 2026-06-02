import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    // now.getTime() trả về Epoch ms (UTC), ta cộng thêm 7 tiếng
    const dateInGmt7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const currentHour = dateInGmt7.getUTCHours(); // 0 - 23
    const currentDayOfMonth = dateInGmt7.getUTCDate(); // 1 - 31
    const utcDay = dateInGmt7.getUTCDay();
    const currentDayOfWeek = utcDay === 0 ? 7 : utcDay; // CN -> 7, Thứ 2 -> 1, ..., Thứ 7 -> 6

    console.log(
      `[Backup Cron] Bắt đầu quét lịch trình sao lưu tại giờ GMT+7: ${currentHour}:00, ` +
        `Ngày trong tháng: ${currentDayOfMonth}, Ngày trong tuần: ${currentDayOfWeek}`
    );

    // 2. Lấy danh sách cấu hình auto backup khớp với giờ hiện tại
    const { data: connections, error: queryError } = await supabaseAdmin
      .from("user_telegram_connections")
      .select("user_id, telegram_chat_id, telegram_username, backup_interval, backup_day")
      .eq("is_auto_backup", true)
      .eq("backup_hour", currentHour)
      .not("telegram_chat_id", "is", null);

    if (queryError) {
      console.error("[Backup Cron] Lỗi truy vấn database:", queryError);
      return NextResponse.json({ success: false, message: queryError.message }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
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
    const results = [];

    // 4. Lặp qua từng user để tạo file sao lưu và gửi Telegram
    for (const target of targetUsers) {
      const userId = target.user_id;
      const telegramChatId = target.telegram_chat_id;

      try {
        // Thiết lập email metadata mà không gọi Auth API để tránh Rate Limit (429)
        const userEmail = target.telegram_username
          ? `${target.telegram_username}@telegram.org`
          : "auto-backup@moneyplus.local";

        // Lấy workspace cá nhân của user
        const { data: personalWorkspace, error: wsError } = await supabaseAdmin
          .from("workspaces")
          .select("*")
          .eq("created_by", userId)
          .eq("is_personal", true)
          .maybeSingle();

        if (wsError) {
          throw new Error(`Lấy workspace cá nhân thất bại: ${wsError.message}`);
        }

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
          });
          results.push({ userId, status: "skipped", reason: "No personal workspace" });
          continue;
        }

        const workspaceId = personalWorkspace.id;

        // Lấy chi tiết dữ liệu từ các bảng liên quan đến workspace cá nhân
        const [
          { data: accounts },
          { data: categories },
          { data: transactions },
        ] = await Promise.all([
          supabaseAdmin.from("accounts").select("*").eq("workspace_id", workspaceId),
          supabaseAdmin.from("categories").select("*").eq("workspace_id", workspaceId),
          supabaseAdmin.from("transactions").select("*").eq("workspace_id", workspaceId),
        ]);

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
          accounts: accounts || [],
          categories: categories || [],
          transactions: transactions || [],
        };

        const fileName = `money_backup_${new Date().toISOString().split("T")[0]}.json`;
        const backupStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([backupStr], { type: "application/json" });

        const formData = new FormData();
        formData.append("chat_id", telegramChatId.toString());
        formData.append("document", blob, fileName);
        formData.append(
          "caption",
          `💾 <b>Bản sao lưu dữ liệu tự động Money+</b>\n\n` +
            `• <b>Thời gian:</b> ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}\n` +
            `• <b>Tần suất:</b> ${target.backup_interval === "daily" ? "Hằng ngày" : target.backup_interval === "weekly" ? "Hằng tuần" : "Hằng tháng"}\n` +
            `• <b>Loại dữ liệu:</b> Cá nhân\n` +
            `• <b>Tài khoản/Ví:</b> ${accounts?.length || 0}\n` +
            `• <b>Giao dịch:</b> ${transactions?.length || 0}\n\n` +
            `<i>⚠️ Đây là file chứa dữ liệu chi tiêu cá nhân của riêng bạn. Hãy lưu trữ an toàn và tuyệt đối không chia sẻ cho bất kỳ ai.</i>`
        );
        formData.append("parse_mode", "HTML");

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
        const telegramRes = await fetch(telegramUrl, {
          method: "POST",
          body: formData,
        });

        if (!telegramRes.ok) {
          const errText = await telegramRes.text();
          throw new Error(`Telegram API Error: ${errText}`);
        }

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
