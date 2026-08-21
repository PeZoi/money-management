import { getSystemSetting } from "@/lib/services/system-settings";
import { v2 as cloudinary } from "cloudinary";

export interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Lấy cấu hình Cloudinary (DB -> fallback sang process.env)
 */
export async function getDynamicCloudinaryConfig(): Promise<CloudinaryConfig> {
  const cloud_name = await getSystemSetting("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD_NAME");
  const api_key = await getSystemSetting("CLOUDINARY_API_KEY", "CLOUDINARY_API_KEY");
  const api_secret = await getSystemSetting("CLOUDINARY_API_SECRET", "CLOUDINARY_API_SECRET");

  return {
    cloud_name,
    api_key,
    api_secret,
  };
}

/**
 * Khởi tạo và trả về instance Cloudinary v2 đã được gán cấu hình động
 */
export async function getCloudinaryClient(overrideConfig?: Partial<CloudinaryConfig>) {
  const currentConfig = await getDynamicCloudinaryConfig();
  const config = {
    ...currentConfig,
    ...overrideConfig,
  };

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error(
      "Chưa cấu hình đầy đủ thông tin Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)."
    );
  }

  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true,
  });

  return cloudinary;
}

function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export interface CloudinaryUsageReport {
  plan: string;
  lastUpdated: string;
  storage: {
    usageBytes: number;
    usageFormatted: string;
    limitBytes: number | null;
    limitFormatted: string;
    usedPercent: number;
    freeFormatted: string;
  };
  bandwidth: {
    usageBytes: number;
    usageFormatted: string;
    limitBytes: number | null;
    limitFormatted: string;
    usedPercent: number;
  };
  transformations: {
    usage: number;
    limit: number | null;
    usedPercent: number;
  };
  credits?: {
    usage: number;
    limit: number | null;
    usedPercent: number;
  };
  resourcesCount: number;
  mediaLimits?: {
    imageMaxSizeBytes?: number;
    imageMaxSizeFormatted: string;
    videoMaxSizeBytes?: number;
    videoMaxSizeFormatted: string;
  };
}

/**
 * Lấy chi tiết thống kê dung lượng, băng thông, số lượng file của tài khoản Cloudinary
 */
export async function getCloudinaryUsage(
  config?: CloudinaryConfig
): Promise<{ success: boolean; data?: CloudinaryUsageReport; error?: string }> {
  try {
    const client = config
      ? await getCloudinaryClient(config)
      : await getCloudinaryClient();

    // Gọi Cloudinary Admin API usage
    const res = await client.api.usage();

    const plan = res.plan || "Free";
    const lastUpdated = res.last_updated || new Date().toISOString().split("T")[0];

    const storageUsage = res.storage?.usage || 0;
    const storageLimit = res.storage?.limit || null;
    const storageFreeBytes = storageLimit ? Math.max(0, storageLimit - storageUsage) : null;

    const bandwidthUsage = res.bandwidth?.usage || 0;
    const bandwidthLimit = res.bandwidth?.limit || null;

    const transUsage = res.transformations?.usage || 0;
    const transLimit = res.transformations?.limit || null;
    const transPercent =
      res.transformations?.used_percent ??
      (transLimit ? Math.min(100, Math.round((transUsage / transLimit) * 1000) / 10) : 0);

    let creditsInfo: CloudinaryUsageReport["credits"] | undefined;
    if (res.credits) {
      creditsInfo = {
        usage: res.credits.usage || 0,
        limit: res.credits.limit || null,
        usedPercent: res.credits.used_percent || 0,
      };
    }

    // Nếu dùng hệ thống Credits (như Free Plan, Plus...), 1 Credit = 1 GB (1024 MB)
    const creditPoolBytes = creditsInfo?.limit ? creditsInfo.limit * 1024 * 1024 * 1024 : null;
    const creditFreeBytes =
      creditsInfo?.limit && creditsInfo.usage !== undefined
        ? Math.max(0, (creditsInfo.limit - creditsInfo.usage) * 1024 * 1024 * 1024)
        : null;

    const finalStorageLimit = storageLimit || creditPoolBytes;
    const finalStorageFree = storageFreeBytes !== null ? storageFreeBytes : creditFreeBytes;
    const finalStoragePercent =
      res.storage?.used_percent ??
      (finalStorageLimit
        ? Math.min(100, Math.round((storageUsage / finalStorageLimit) * 1000) / 10)
        : creditsInfo?.usedPercent ?? 0);

    const finalBandwidthLimit = bandwidthLimit || creditPoolBytes;
    const finalBandwidthPercent =
      res.bandwidth?.used_percent ??
      (finalBandwidthLimit
        ? Math.min(100, Math.round((bandwidthUsage / finalBandwidthLimit) * 1000) / 10)
        : creditsInfo?.usedPercent ?? 0);

    const resourcesCount =
      res.resources || res.objects?.usage || 0;

    const mediaLimits = res.media_limits
      ? {
        imageMaxSizeBytes: res.media_limits.image_max_size_bytes,
        imageMaxSizeFormatted: formatBytes(res.media_limits.image_max_size_bytes),
        videoMaxSizeBytes: res.media_limits.video_max_size_bytes,
        videoMaxSizeFormatted: formatBytes(res.media_limits.video_max_size_bytes),
      }
      : undefined;

    return {
      success: true,
      data: {
        plan,
        lastUpdated,
        storage: {
          usageBytes: storageUsage,
          usageFormatted: formatBytes(storageUsage),
          limitBytes: finalStorageLimit,
          limitFormatted: finalStorageLimit
            ? `${formatBytes(finalStorageLimit)} (Theo Credits)`
            : "Dùng chung Credits",
          usedPercent: finalStoragePercent,
          freeFormatted: finalStorageFree !== null ? formatBytes(finalStorageFree) : "Theo Credits còn lại",
        },
        bandwidth: {
          usageBytes: bandwidthUsage,
          usageFormatted: formatBytes(bandwidthUsage),
          limitBytes: finalBandwidthLimit,
          limitFormatted: finalBandwidthLimit
            ? `${formatBytes(finalBandwidthLimit)} (Theo Credits)`
            : "Dùng chung Credits",
          usedPercent: finalBandwidthPercent,
        },
        transformations: {
          usage: transUsage,
          limit: transLimit,
          usedPercent: transPercent,
        },
        credits: creditsInfo,
        resourcesCount,
        mediaLimits,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

/**
 * Kiểm tra kết nối tới máy chủ Cloudinary
 */
export async function pingCloudinary(
  config?: CloudinaryConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const client = config
      ? await getCloudinaryClient(config)
      : await getCloudinaryClient();
    const res = await client.api.ping();
    if (res.status === "ok") {
      return {
        success: true,
        message: "Kết nối tới Cloudinary thành công (Status: ok)",
      };
    }
    return {
      success: false,
      message: `Cloudinary phản hồi: ${JSON.stringify(res)}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: `Lỗi kết nối Cloudinary: ${msg}` };
  }
}
