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
