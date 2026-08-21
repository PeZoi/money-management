import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getAllSystemSettingsForAdmin,
  updateSystemSettings,
} from "@/lib/services/system-settings";
import {
  AI_PROVIDER_PRESETS,
  type AIProvider,
} from "@/types/ai-providers";
import { NextResponse } from "next/server";

/**
 * Hàm hỗ trợ che giấu (mask) API Key / Secret khi gửi về Client
 */
function maskSecret(val: string): string {
  if (!val || val.length === 0) return "";
  if (val.length <= 8) return "••••••••";
  return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
}

/**
 * GET /api/admin/settings
 * Lấy toàn bộ cấu hình hệ thống (đã được mask bảo mật).
 */
export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const rawSettings = await getAllSystemSettingsForAdmin();
    const dbMap: Record<string, string> = {};
    for (const item of rawSettings) {
      dbMap[item.key] = item.value;
    }

    // 1. AI Settings (Cấu hình riêng cho từng Provider)
    const activeProvider = (dbMap["AI_ACTIVE_PROVIDER"] || "groq") as AIProvider;
    const validActiveProvider: AIProvider = AI_PROVIDER_PRESETS[activeProvider] ? activeProvider : "groq";

    const allProviders: AIProvider[] = ["groq", "openrouter", "orcarouter"];
    const providersData: Record<
      AIProvider,
      {
        hasApiKey: boolean;
        apiKey?: string;
        apiKeyMasked: string;
        isKeyFromEnv: boolean;
        model: string;
        baseUrl: string;
      }
    > = {
      groq: { hasApiKey: false, apiKey: "", apiKeyMasked: "", isKeyFromEnv: false, model: "", baseUrl: "" },
      openrouter: { hasApiKey: false, apiKey: "", apiKeyMasked: "", isKeyFromEnv: false, model: "", baseUrl: "" },
      orcarouter: { hasApiKey: false, apiKey: "", apiKeyMasked: "", isKeyFromEnv: false, model: "", baseUrl: "" },
    };

    for (const p of allProviders) {
      const pUpper = p.toUpperCase();
      const preset = AI_PROVIDER_PRESETS[p];

      // API Key: Ưu tiên AI_{PROVIDER}_API_KEY -> AI_API_KEY (nếu activeProvider trùng) -> process.env
      let key = dbMap[`AI_${pUpper}_API_KEY`];
      let fromDb = Boolean(key);
      if (!key && p === validActiveProvider && dbMap["AI_API_KEY"]) {
        key = dbMap["AI_API_KEY"];
        fromDb = true;
      }
      if (!key) {
        key =
          process.env[preset?.envKey] ||
          (p === "groq" ? process.env.GROQ_API_KEY : "") ||
          (p === "openrouter" ? process.env.OPENROUTER_API_KEY : "") ||
          (p === "orcarouter" ? process.env.AI_API_KEY : "") ||
          "";
      }

      // Model
      let model = dbMap[`AI_${pUpper}_MODEL`];
      if (model === undefined && p === validActiveProvider && dbMap["AI_MODEL"] !== undefined) {
        model = dbMap["AI_MODEL"];
      }
      model = model || "";

      // Base URL
      let baseUrl = dbMap[`AI_${pUpper}_BASE_URL`];
      if (baseUrl === undefined && p === validActiveProvider && dbMap["AI_BASE_URL"] !== undefined) {
        baseUrl = dbMap["AI_BASE_URL"];
      }
      baseUrl = baseUrl || "";

      providersData[p] = {
        hasApiKey: Boolean(key),
        apiKey: key || "",
        apiKeyMasked: maskSecret(key),
        isKeyFromEnv: !fromDb && Boolean(key),
        model,
        baseUrl,
      };
    }

    // 2. Cloudinary Settings (Multi-Profile)
    const rawCloudName = dbMap["CLOUDINARY_CLOUD_NAME"] || process.env.CLOUDINARY_CLOUD_NAME || "";
    const rawCloudApiKey = dbMap["CLOUDINARY_API_KEY"] || process.env.CLOUDINARY_API_KEY || "";
    const rawCloudApiSecret = dbMap["CLOUDINARY_API_SECRET"] || process.env.CLOUDINARY_API_SECRET || "";

    let profilesList: {
      id: string;
      name: string;
      cloudName: string;
      apiKey: string;
      apiSecret: string;
    }[] = [];

    if (dbMap["CLOUDINARY_PROFILES"]) {
      try {
        const parsed = JSON.parse(dbMap["CLOUDINARY_PROFILES"]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          profilesList = parsed;
        }
      } catch (e) {
        console.error("Lỗi parse CLOUDINARY_PROFILES:", e);
      }
    }

    if (profilesList.length === 0) {
      profilesList = [
        {
          id: "default",
          name: "Tài khoản chính",
          cloudName: rawCloudName,
          apiKey: rawCloudApiKey,
          apiSecret: rawCloudApiSecret,
        },
      ];
    }

    let activeProfileId = dbMap["CLOUDINARY_ACTIVE_PROFILE"] || profilesList[0]?.id || "default";
    let activeProfile = profilesList.find((p) => p.id === activeProfileId) || profilesList[0];
    if (!activeProfile) {
      activeProfile = profilesList[0] || {
        id: "default",
        name: "Tài khoản chính",
        cloudName: rawCloudName,
        apiKey: rawCloudApiKey,
        apiSecret: rawCloudApiSecret,
      };
      activeProfileId = activeProfile.id;
    }

    const processedProfiles = profilesList.map((p) => {
      const isFromEnv =
        !dbMap["CLOUDINARY_PROFILES"] &&
        !dbMap["CLOUDINARY_CLOUD_NAME"] &&
        Boolean(process.env.CLOUDINARY_CLOUD_NAME);

      return {
        id: p.id,
        name: p.name || "Tài khoản Cloudinary",
        cloudName: p.cloudName || "",
        apiKey: p.apiKey || "",
        apiSecret: p.apiSecret || "",
        hasApiKey: Boolean(p.apiKey),
        apiKeyMasked: maskSecret(p.apiKey || ""),
        hasApiSecret: Boolean(p.apiSecret),
        apiSecretMasked: maskSecret(p.apiSecret || ""),
        isFromEnv,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ai: {
          activeProvider: validActiveProvider,
          // Giữ backward compatibility cho code cũ nếu cần
          provider: validActiveProvider,
          model: providersData[validActiveProvider].model,
          baseUrl: providersData[validActiveProvider].baseUrl,
          hasApiKey: providersData[validActiveProvider].hasApiKey,
          apiKeyMasked: providersData[validActiveProvider].apiKeyMasked,
          isKeyFromEnv: providersData[validActiveProvider].isKeyFromEnv,
          providers: providersData,
        },
        cloudinary: {
          activeProfileId,
          profiles: processedProfiles,
          cloudName: activeProfile.cloudName || rawCloudName,
          apiKey: activeProfile.apiKey || rawCloudApiKey,
          apiSecret: activeProfile.apiSecret || rawCloudApiSecret,
          hasApiKey: Boolean(activeProfile.apiKey || rawCloudApiKey),
          apiKeyMasked: maskSecret(activeProfile.apiKey || rawCloudApiKey),
          hasApiSecret: Boolean(activeProfile.apiSecret || rawCloudApiSecret),
          apiSecretMasked: maskSecret(activeProfile.apiSecret || rawCloudApiSecret),
          isFromEnv:
            !dbMap["CLOUDINARY_CLOUD_NAME"] &&
            !dbMap["CLOUDINARY_PROFILES"] &&
            Boolean(process.env.CLOUDINARY_CLOUD_NAME),
        },
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("GET /api/admin/settings error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings
 * Cập nhật cấu hình hệ thống
 */
export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const rawSettings = await getAllSystemSettingsForAdmin();
    const dbMap: Record<string, string> = {};
    for (const s of rawSettings) {
      dbMap[s.key] = s.value;
    }

    const updates: { key: string; value: string; is_secret?: boolean; description?: string }[] = [];

    // 1. Cập nhật AI Settings
    if (body.ai) {
      const activeP = body.ai.activeProvider || body.ai.provider;
      if (typeof activeP === "string" && activeP.trim()) {
        updates.push({
          key: "AI_ACTIVE_PROVIDER",
          value: activeP.trim(),
          description: "Nhà cung cấp AI kích hoạt (groq, openrouter, orcarouter)",
          is_secret: false,
        });
      }

      // Cập nhật cấu hình riêng từng provider nếu gửi providers map
      if (body.ai.providers && typeof body.ai.providers === "object") {
        for (const [pName, pConfig] of Object.entries(body.ai.providers)) {
          const pUpper = pName.toUpperCase();
          if (pConfig && typeof pConfig === "object") {
            const conf = pConfig as { apiKey?: string; model?: string; baseUrl?: string };
            if (typeof conf.model === "string") {
              updates.push({
                key: `AI_${pUpper}_MODEL`,
                value: conf.model.trim(),
                description: `Model AI cho ${pName}`,
                is_secret: false,
              });
            }
            if (typeof conf.baseUrl === "string") {
              updates.push({
                key: `AI_${pUpper}_BASE_URL`,
                value: conf.baseUrl.trim(),
                description: `Base URL cho ${pName}`,
                is_secret: false,
              });
            }
            if (
              typeof conf.apiKey === "string" &&
              conf.apiKey.trim() &&
              !conf.apiKey.includes("••••")
            ) {
              updates.push({
                key: `AI_${pUpper}_API_KEY`,
                value: conf.apiKey.trim(),
                description: `API Key cho ${pName}`,
                is_secret: true,
              });
            }
          }
        }
      }
    }

    // 2. Cập nhật Cloudinary Settings (Multi-Profile)
    if (body.cloudinary) {
      const c = body.cloudinary;
      const targetProfiles = c.profiles;

      let existingProfiles: { id: string; name: string; cloudName: string; apiKey: string; apiSecret: string }[] = [];
      if (dbMap["CLOUDINARY_PROFILES"]) {
        try {
          const parsed = JSON.parse(dbMap["CLOUDINARY_PROFILES"]);
          if (Array.isArray(parsed)) existingProfiles = parsed;
        } catch {
          // ignore
        }
      }

      if (Array.isArray(targetProfiles) && targetProfiles.length > 0) {
        const cleanProfiles = targetProfiles.map((p, idx) => {
          const existing = existingProfiles.find((ep) => ep.id === p.id);
          let key = p.apiKey;
          if (key === undefined || key.includes("••••")) {
            key = existing?.apiKey || (idx === 0 ? dbMap["CLOUDINARY_API_KEY"] || process.env.CLOUDINARY_API_KEY || "" : "");
          }
          let secret = p.apiSecret;
          if (secret === undefined || secret.includes("••••")) {
            secret = existing?.apiSecret || (idx === 0 ? dbMap["CLOUDINARY_API_SECRET"] || process.env.CLOUDINARY_API_SECRET || "" : "");
          }

          return {
            id: p.id || `profile-${idx + 1}`,
            name: p.name?.trim() || `Tài khoản ${idx + 1}`,
            cloudName: p.cloudName?.trim() || "",
            apiKey: key?.trim() || "",
            apiSecret: secret?.trim() || "",
          };
        });

        const activeId = c.activeProfileId || cleanProfiles[0]?.id || "default";
        const activeProf = cleanProfiles.find((p) => p.id === activeId) || cleanProfiles[0];

        updates.push({
          key: "CLOUDINARY_ACTIVE_PROFILE",
          value: activeId,
          description: "ID profile Cloudinary đang kích hoạt",
          is_secret: false,
        });

        updates.push({
          key: "CLOUDINARY_PROFILES",
          value: JSON.stringify(cleanProfiles),
          description: "Danh sách profiles Cloudinary đa tài khoản",
          is_secret: true,
        });

        if (activeProf) {
          updates.push({
            key: "CLOUDINARY_CLOUD_NAME",
            value: activeProf.cloudName,
            description: "Cloudinary Cloud Name (Active Profile)",
            is_secret: false,
          });
          if (activeProf.apiKey) {
            updates.push({
              key: "CLOUDINARY_API_KEY",
              value: activeProf.apiKey,
              description: "Cloudinary API Key (Active Profile)",
              is_secret: true,
            });
          }
          if (activeProf.apiSecret) {
            updates.push({
              key: "CLOUDINARY_API_SECRET",
              value: activeProf.apiSecret,
              description: "Cloudinary API Secret (Active Profile)",
              is_secret: true,
            });
          }
        }
      } else if (typeof c.cloudName === "string") {
        updates.push({
          key: "CLOUDINARY_CLOUD_NAME",
          value: c.cloudName.trim(),
          description: "Cloudinary Cloud Name",
          is_secret: false,
        });

        if (
          typeof c.apiKey === "string" &&
          c.apiKey.trim() &&
          !c.apiKey.includes("••••")
        ) {
          updates.push({
            key: "CLOUDINARY_API_KEY",
            value: c.apiKey.trim(),
            description: "Cloudinary API Key",
            is_secret: true,
          });
        }

        if (
          typeof c.apiSecret === "string" &&
          c.apiSecret.trim() &&
          !c.apiSecret.includes("••••")
        ) {
          updates.push({
            key: "CLOUDINARY_API_SECRET",
            value: c.apiSecret.trim(),
            description: "Cloudinary API Secret",
            is_secret: true,
          });
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Không có thay đổi nào cần lưu.",
      });
    }

    await updateSystemSettings(updates, user?.id);

    return NextResponse.json({
      success: true,
      message: "Cấu hình hệ thống đã được lưu và cập nhật thành công.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Lỗi không xác định";
    console.error("PATCH /api/admin/settings error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
