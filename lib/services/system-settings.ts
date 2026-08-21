import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag, unstable_cache } from "next/cache";

export interface SystemSettingItem {
  key: string;
  value: string;
  description?: string | null;
  is_secret: boolean;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Cache nội bộ server để tối ưu hóa truy vấn Database.
 * Tag 'system-settings' sẽ được revalidate ngay lập tức khi Admin cập nhật cấu hình.
 */
const getCachedSettingsFromDb = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const supabaseAdmin = createAdminClient();
      const { data, error } = await supabaseAdmin
        .from("system_settings")
        .select("key, value");

      if (error) {
        console.error("Lỗi khi đọc bảng system_settings:", error.message);
        return {};
      }

      const map: Record<string, string> = {};
      if (data) {
        for (const item of data) {
          map[item.key] = item.value;
        }
      }
      return map;
    } catch (err) {
      console.error("Lỗi getCachedSettingsFromDb:", err);
      return {};
    }
  },
  ["system-settings-cache"],
  {
    tags: ["system-settings"],
    revalidate: 300, // 5 phút
  }
);

/**
 * Lấy giá trị của một biến cấu hình hệ thống:
 * 1. Ưu tiên đọc từ Database (bảng system_settings).
 * 2. Nếu trong DB không có hoặc chuỗi rỗng -> Fallback về process.env tương ứng.
 * 3. Nếu vẫn không có -> Trả về defaultValue hoặc chuỗi rỗng.
 */
export async function getSystemSetting(
  key: string,
  envFallbackKey?: string,
  defaultValue = ""
): Promise<string> {
  const settingsMap = await getCachedSettingsFromDb();
  const dbValue = settingsMap[key];

  if (dbValue && dbValue.trim() !== "") {
    return dbValue.trim();
  }

  if (envFallbackKey && process.env[envFallbackKey]) {
    return process.env[envFallbackKey] || defaultValue;
  }

  // Fallback thử chính key đó trên process.env
  if (process.env[key]) {
    return process.env[key] || defaultValue;
  }

  return defaultValue;
}

/**
 * Lấy toàn bộ danh sách cài đặt thô từ DB (Dành riêng cho Admin UI)
 */
export async function getAllSystemSettingsForAdmin(): Promise<SystemSettingItem[]> {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("system_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    console.error("Lỗi getAllSystemSettingsForAdmin:", error.message);
    return [];
  }

  return (data || []) as SystemSettingItem[];
}

/**
 * Cập nhật hoặc thêm mới nhiều cấu hình cùng lúc vào DB
 */
export async function updateSystemSettings(
  items: { key: string; value: string; is_secret?: boolean; description?: string }[],
  userId?: string
) {
  const supabaseAdmin = createAdminClient();

  for (const item of items) {
    const { error } = await supabaseAdmin
      .from("system_settings")
      .upsert({
        key: item.key,
        value: item.value,
        is_secret: item.is_secret ?? false,
        description: item.description ?? null,
        updated_at: new Date().toISOString(),
        updated_by: userId ?? null,
      });

    if (error) {
      console.error(`Lỗi cập nhật setting [${item.key}]:`, error.message);
      throw new Error(`Không thể lưu cấu hình ${item.key}: ${error.message}`);
    }
  }

  // Xóa cache tag để các request sau nhận dữ liệu mới ngay lập tức
  try {
    revalidateTag("system-settings", "max");
  } catch (err) {
    console.warn("Lỗi revalidateTag system-settings:", err);
  }
}
