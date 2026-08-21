import { requireAdmin } from "@/lib/admin/require-admin";
import {
  AI_PROVIDER_PRESETS,
  callAICompletionsWithDetails,
  getActiveAIConfig,
  type AIProvider,
} from "@/lib/utils/ai-client-server";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/settings/test-ai
 * Kiểm tra kết nối AI với cấu hình gửi lên hoặc cấu hình hiện tại trong DB/Env
 */
export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => ({}));
    const activeConfig = await getActiveAIConfig();

    const provider = (body.provider || activeConfig.provider) as AIProvider;
    const preset = AI_PROVIDER_PRESETS[provider];
    let apiKey = body.apiKey?.trim() || "";

    // Nếu apiKey truyền lên là chuỗi mask hoặc trống -> Lấy apiKey đang lưu trong hệ thống nếu cùng provider
    if (!apiKey || apiKey.includes("••••")) {
      if (provider === activeConfig.provider) {
        apiKey = activeConfig.apiKey;
      } else {
        apiKey = (preset ? process.env[preset.envKey] : "") || "";
      }
    }

    const model = body.model?.trim() || "";
    const baseUrl = body.baseUrl?.trim() || "";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: `Chưa có API Key cho ${provider.toUpperCase()}. Vui lòng nhập API Key.`,
        },
        { status: 400 }
      );
    }

    const result = await callAICompletionsWithDetails({
      messages: [
        {
          role: "user",
          content:
            "Bạn là AI / Model nào? Hãy trả lời thật ngắn gọn trong 1-2 câu bằng tiếng Việt (xác nhận tên model của bạn) và kết thúc bằng câu 'Kết nối AI thành công!'.",
        },
      ],
      temperature: 0.2,
      maxTokens: 500,
      configOverride: {
        provider,
        apiKey,
        model,
        baseUrl,
      },
    });

    return NextResponse.json({
      success: true,
      provider: result.provider,
      model: result.model,
      latencyMs: result.latencyMs,
      reply: result.content.trim(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("POST /api/admin/settings/test-ai error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
