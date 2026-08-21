import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getDynamicCloudinaryConfig,
  pingCloudinary,
} from "@/lib/services/cloudinary-server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/settings/test-cloudinary
 * Kiểm tra kết nối tới Cloudinary với credentials gửi lên hoặc credentials trong DB/Env
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
            "Chưa đầy đủ thông tin Cloud Name, API Key hoặc API Secret để kiểm tra.",
        },
        { status: 400 }
      );
    }

    const result = await pingCloudinary({
      cloud_name,
      api_key,
      api_secret,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("POST /api/admin/settings/test-cloudinary error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
