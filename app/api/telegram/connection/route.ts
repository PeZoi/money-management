import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lấy thông tin kết nối Telegram và lịch sao lưu tự động của User
export async function GET() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_telegram_connections")
    .select("telegram_chat_id, telegram_username, is_auto_backup, backup_interval, backup_day, backup_hour, telegram_display_name, telegram_avatar_path")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    connected: !!data?.telegram_chat_id,
    telegram_username: data?.telegram_username || null,
    telegram_display_name: data?.telegram_display_name || null,
    telegram_avatar_path: data?.telegram_avatar_path || null,
    is_auto_backup: data?.is_auto_backup ?? false,
    backup_interval: data?.backup_interval ?? "weekly",
    backup_day: data?.backup_day ?? 1,
    backup_hour: data?.backup_hour ?? 0,
  });
}

// Tạo mã kết nối Telegram (Connection Token) có hiệu lực 10 phút
export async function POST() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 phút hiệu lực

  const { error } = await supabase
    .from("user_telegram_connections")
    .upsert(
      {
        user_id: userData.user.id,
        connection_token: token,
        token_expires_at: expiresAt,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || "moneydph_bot";
  const link = `https://t.me/${botName}?start=${token}`;

  return NextResponse.json({ link, token });
}

// Cập nhật cấu hình tự động sao lưu và lịch trình tùy chỉnh
export async function PUT(req: Request) {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { is_auto_backup, backup_interval, backup_day, backup_hour } = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof is_auto_backup === "boolean") updateData.is_auto_backup = is_auto_backup;
    if (backup_interval) updateData.backup_interval = backup_interval;
    if (typeof backup_day === "number") updateData.backup_day = backup_day;
    if (typeof backup_hour === "number") updateData.backup_hour = backup_hour;

    const { error } = await supabase
      .from("user_telegram_connections")
      .update(updateData)
      .eq("user_id", userData.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// Hủy liên kết Telegram
export async function DELETE() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_telegram_connections")
    .delete()
    .eq("user_id", userData.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Đồng bộ thông tin thực tế từ Telegram (Ảnh đại diện, Họ tên, Username)
export async function PATCH() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = userData.user.id;

  // 1. Kiểm tra liên kết Telegram của user
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
      { error: "Tài khoản chưa được liên kết với Telegram Bot." },
      { status: 400 }
    );
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json(
      { error: "Telegram Bot Token chưa được cấu hình ở Server." },
      { status: 500 }
    );
  }

  try {
    // 2. Gọi getChat tới Telegram Bot API để lấy profile mới nhất
    const getChatUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${connection.telegram_chat_id}`;
    const getChatRes = await fetch(getChatUrl);
    if (!getChatRes.ok) {
      const errText = await getChatRes.text();
      return NextResponse.json(
        { error: `Lấy thông tin từ Telegram thất bại: ${errText}` },
        { status: 502 }
      );
    }

    const chatData = await getChatRes.json();
    if (!chatData.ok || !chatData.result) {
      return NextResponse.json(
        { error: "Phản hồi từ Telegram không hợp lệ." },
        { status: 502 }
      );
    }

    const { first_name, last_name, username, photo } = chatData.result;
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || username || "Telegram User";

    // 3. Lấy đường dẫn file ảnh đại diện (avatar_path)
    let avatarPath: string | null = null;
    if (photo && photo.small_file_id) {
      const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.small_file_id}`;
      const getFileRes = await fetch(getFileUrl);
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        if (fileData.ok && fileData.result && fileData.result.file_path) {
          avatarPath = fileData.result.file_path;
        }
      }
    } else {
      // Phương án dự phòng: Sử dụng getUserProfilePhotos của Telegram
      try {
        const photosRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${connection.telegram_chat_id}&limit=1`
        );
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          if (photosData.ok && photosData.result && photosData.result.total_count > 0) {
            const photoSizes = photosData.result.photos[0];
            if (photoSizes && photoSizes.length > 0) {
              const fileId = photoSizes[0].file_id;
              const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
              if (fileRes.ok) {
                const fileData = await fileRes.json();
                if (fileData.ok && fileData.result && fileData.result.file_path) {
                  avatarPath = fileData.result.file_path;
                }
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.error("[Telegram Sync API] Lỗi lấy avatar dự phòng:", fallbackErr);
      }
    }

    // 4. Cập nhật cơ sở dữ liệu
    const { error: updateError } = await supabase
      .from("user_telegram_connections")
      .update({
        telegram_username: username || null,
        telegram_display_name: displayName,
        telegram_avatar_path: avatarPath,
      })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      telegram_username: username || null,
      telegram_display_name: displayName,
      telegram_avatar_path: avatarPath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

