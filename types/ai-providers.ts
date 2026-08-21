export type AIProvider = "groq" | "openrouter" | "orcarouter";

export interface AIProviderPreset {
  name: string;
  envKey: string;
}

export interface ProviderSettingItem {
  hasApiKey: boolean;
  apiKey?: string;
  apiKeyMasked: string;
  isKeyFromEnv: boolean;
  model: string;
  baseUrl: string;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallAIOptions {
  messages: AIChatMessage[];
  responseFormat?: "json_object" | "text";
  temperature?: number;
  maxTokens?: number;
  configOverride?: Partial<AIConfig>;
}

export const AI_PROVIDER_PRESETS: Record<AIProvider, AIProviderPreset> = {
  groq: {
    name: "Groq Cloud",
    envKey: "GROQ_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
  },
  orcarouter: {
    name: "OrcaRouter",
    envKey: "AI_API_KEY",
  },
};
