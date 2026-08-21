import { getSystemSetting } from "@/lib/services/system-settings";
import {
  AI_PROVIDER_PRESETS,
  type AIConfig,
  type AIProvider,
  type CallAIOptions,
} from "@/types/ai-providers";

export * from "@/types/ai-providers";

export const DEFAULT_PROVIDER_BASE_URLS: Record<AIProvider, string> = {
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
  orcarouter: "https://api.orcarouter.ai/v1",
};

export const DEFAULT_PROVIDER_MODELS: Record<AIProvider, string> = {
  groq: "llama-3.3-70b-versatile",
  openrouter: "deepseek/deepseek-chat",
  orcarouter: "orcarouter/auto",
};

/**
 * Lấy cấu hình của một provider cụ thể từ DB/env/defaults
 */
export async function getProviderConfig(provider: AIProvider): Promise<AIConfig> {
  const validProvider: AIProvider = AI_PROVIDER_PRESETS[provider] ? provider : "groq";
  const preset = AI_PROVIDER_PRESETS[validProvider];
  const pKey = validProvider.toUpperCase();

  // 1. API Key: AI_{PROVIDER}_API_KEY -> AI_API_KEY (nếu active) -> env
  let apiKey = await getSystemSetting(`AI_${pKey}_API_KEY`);
  if (!apiKey) {
    const activeProvider = await getSystemSetting("AI_ACTIVE_PROVIDER", undefined, "groq");
    if (activeProvider === validProvider) {
      apiKey = await getSystemSetting("AI_API_KEY");
    }
  }
  if (!apiKey) {
    apiKey =
      process.env[preset.envKey] ||
      (validProvider === "groq" ? process.env.GROQ_API_KEY : "") ||
      (validProvider === "openrouter" ? process.env.OPENROUTER_API_KEY : "") ||
      (validProvider === "orcarouter" ? process.env.AI_API_KEY : "") ||
      "";
  }

  // 2. Model: AI_{PROVIDER}_MODEL -> AI_MODEL (nếu active) -> default model
  let model = await getSystemSetting(`AI_${pKey}_MODEL`);
  if (!model) {
    const activeProvider = await getSystemSetting("AI_ACTIVE_PROVIDER", undefined, "groq");
    if (activeProvider === validProvider) {
      model = await getSystemSetting("AI_MODEL", "AI_MODEL");
    }
  }
  model = model?.trim() || DEFAULT_PROVIDER_MODELS[validProvider];

  // 3. Base URL: AI_{PROVIDER}_BASE_URL -> AI_BASE_URL (nếu active) -> default baseUrl
  let baseUrl = await getSystemSetting(`AI_${pKey}_BASE_URL`);
  if (!baseUrl) {
    const activeProvider = await getSystemSetting("AI_ACTIVE_PROVIDER", undefined, "groq");
    if (activeProvider === validProvider) {
      baseUrl = await getSystemSetting("AI_BASE_URL");
    }
  }
  baseUrl = baseUrl?.trim() || DEFAULT_PROVIDER_BASE_URLS[validProvider];

  return {
    provider: validProvider,
    apiKey,
    model,
    baseUrl,
  };
}

/**
 * Lấy cấu hình AI hiện tại (Active Provider)
 */
export async function getActiveAIConfig(): Promise<AIConfig> {
  const provider = (await getSystemSetting("AI_ACTIVE_PROVIDER", undefined, "groq")) as AIProvider;
  return getProviderConfig(provider);
}

export interface AICompletionResult {
  content: string;
  model: string;
  provider: AIProvider;
  latencyMs: number;
}

/**
 * Hàm gọi API Chat Completion chuẩn OpenAI kèm thông tin chi tiết (model thực tế, latency, provider)
 */
export async function callAICompletionsWithDetails(
  options: CallAIOptions
): Promise<AICompletionResult> {
  const startTime = Date.now();
  const activeConfig = await getActiveAIConfig();
  const provider = options.configOverride?.provider || activeConfig.provider;
  const savedProviderConfig = await getProviderConfig(provider);

  // Lấy apiKey: ưu tiên configOverride -> cấu hình đã lưu của provider đó
  const apiKey = options.configOverride?.apiKey?.trim() || savedProviderConfig.apiKey;

  // Model & Base URL: ưu tiên override -> cấu hình lưu của provider -> default
  const model =
    options.configOverride?.model?.trim() ||
    savedProviderConfig.model ||
    DEFAULT_PROVIDER_MODELS[provider] ||
    "deepseek/deepseek-chat";

  const baseUrl =
    options.configOverride?.baseUrl?.trim() ||
    savedProviderConfig.baseUrl ||
    DEFAULT_PROVIDER_BASE_URLS[provider] ||
    "https://openrouter.ai/api/v1";

  const config: AIConfig = {
    provider,
    apiKey,
    model,
    baseUrl,
  };

  if (!config.apiKey) {
    throw new Error(
      `Chưa cấu hình API Key cho nhà cung cấp [${config.provider.toUpperCase()}]. Vui lòng nhập API Key.`
    );
  }

  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };

  // Header khuyến nghị của OpenRouter cho rank & tracking
  if (config.provider === "openrouter" || config.baseUrl.includes("openrouter.ai")) {
    headers["HTTP-Referer"] = "https://money-management.app";
    headers["X-Title"] = "Money Management";
  }

  const bodyPayload: Record<string, unknown> = {
    model: config.model,
    messages: options.messages,
    temperature: options.temperature ?? 0.2,
  };

  if (options.maxTokens) {
    bodyPayload.max_tokens = options.maxTokens;
  }

  if (options.responseFormat === "json_object") {
    bodyPayload.response_format = { type: "json_object" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI Error] [${config.provider}] Status: ${response.status}`, errorText);
    let errorMessage = `HTTP ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) {
        errorMessage = parsed.error.message;
      } else if (parsed.message) {
        errorMessage = parsed.message;
      }
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(`[${config.provider.toUpperCase()}] Lỗi (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();
  if (data.error) {
    const errMsg = data.error.message || JSON.stringify(data.error);
    throw new Error(`[${config.provider.toUpperCase()}] ${errMsg}`);
  }

  const choice = data.choices?.[0];
  const msg = choice?.message;
  const content =
    (typeof msg?.content === "string" && msg.content.trim())
      ? msg.content
      : (typeof msg?.reasoning_content === "string" && msg.reasoning_content.trim())
        ? msg.reasoning_content
        : (typeof msg?.reasoning === "string" && msg.reasoning.trim())
          ? msg.reasoning
          : (typeof choice?.text === "string" && choice.text.trim())
            ? choice.text
            : "";

  if (!content) {
    console.error(`[AI Error] Không tìm thấy content trong response:`, data);
    if (choice?.finish_reason === "length") {
      throw new Error(
        `[${config.provider.toUpperCase()}] Model "${config.model}" bị chạm giới hạn token (finish_reason: length) khi đang suy luận. Vui lòng tăng token hoặc thử lại.`
      );
    }
    throw new Error(`[${config.provider.toUpperCase()}] Không nhận được nội dung trả về từ Model "${config.model}".`);
  }

  const returnedModel =
    typeof data.model === "string" && data.model.trim()
      ? data.model.trim()
      : config.model;

  return {
    content,
    model: returnedModel,
    provider: config.provider,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Hàm gọi API Chat Completion chuẩn OpenAI cho bất kỳ Provider nào (Groq, OpenRouter, OrcaRouter,...)
 */
export async function callAICompletions(options: CallAIOptions): Promise<string> {
  const result = await callAICompletionsWithDetails(options);
  return result.content;
}
