import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getCloudinaryUsage,
  getDynamicCloudinaryConfig,
} from "@/lib/services/cloudinary-server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/settings/cloudinary-usage
 * Lấy chi tiết thống kê dung lượng, băng thông, số lượng tài nguyên của Cloudinary
 */
export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const currentConfig = await getDynamicCloudinaryConfig();

    const cloud_name = body.cloudName || currentConfig.cloud_name;
    let api_key = body.apiKey;
    let api_secret = body.apiSecret;

    if (!api_key || api_key.includes("••••")) {
      api_key = currentConfig.api_key;
    }
    if (!api_secret || api_secret.includes("••••")) {
      api_secret = currentConfig.api_secret;
    }

    if (!cloud_name || !api_key || !api_secret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Chưa đầy đủ thông tin Cloud Name, API Key hoặc API Secret để kiểm tra dung lượng.",
        },
        { status: 400 }
      );
    }

    const result = await getCloudinaryUsage({
      cloud_name,
      api_key,
      api_secret,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || "Không thể lấy thông tin dung lượng từ Cloudinary." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("POST /api/admin/settings/cloudinary-usage error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
