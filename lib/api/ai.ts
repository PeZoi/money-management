import { apiClient } from './client';

export interface GetInsightsPayload {
  workspace_id: string;
  months: number;
}

export interface ChatMessageItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatAiPayload {
  workspace_id: string;
  messages: ChatMessageItem[];
}

/**
 * Query Key Factory cho feature AI Insights & Chatbot.
 */
export const aiKeys = {
  all: ['ai'] as const,
  insights: (workspaceId?: string | null, months?: number) =>
    ['ai', 'insights', workspaceId, months] as const,
};

/**
 * API client layer cho Feature AI.
 * Tập trung các cuộc gọi HTTP đến các endpoint AI (Insights & Chat).
 */
export const aiApi = {
  /** Phân tích thông minh các chỉ số tài chính bằng AI */
  async getInsights<T>(payload: GetInsightsPayload): Promise<T> {
    const res = await apiClient<{ data: T }>('/api/ai/insights', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /** Trò chuyện trực tiếp với trợ lý tài chính AI */
  async chat(payload: ChatAiPayload): Promise<string> {
    const res = await apiClient<{ data: string }>('/api/ai/chat', {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },
};
