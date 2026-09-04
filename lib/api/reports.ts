import { apiClient } from './client';
import type { ReportConfigRow, ReportTable } from '@/types/report';

export interface GetReportConfigResponse {
  data: ReportConfigRow | null;
  cloned: boolean;
}

export interface SaveReportConfigPayload {
  workspace_id: string;
  month: string;
  tables: ReportTable[];
}

/**
 * Query Key Factory cho feature Reports.
 * Giúp quản lý cache và invalidate queries chuẩn hóa, chống typo.
 */
export const reportKeys = {
  all: ['reports'] as const,
  config: (workspaceId?: string | null, month?: string) =>
    ['report-config', workspaceId, month] as const,
};

/**
 * API client layer cho Feature Reports.
 * Tập trung các cuộc gọi HTTP liên quan đến báo cáo tài chính và cấu hình bảng biểu.
 */
export const reportsApi = {
  /** Lấy cấu hình bảng báo cáo của workspace theo tháng */
  async getConfig(workspaceId: string, month: string): Promise<GetReportConfigResponse> {
    return apiClient<GetReportConfigResponse>('/api/reports/config', {
      method: 'GET',
      params: {
        workspace_id: workspaceId,
        month,
      },
    });
  },

  /** Lưu cấu hình bảng biểu báo cáo tùy biến */
  async saveConfig(payload: SaveReportConfigPayload): Promise<{ data: ReportConfigRow }> {
    return apiClient<{ data: ReportConfigRow }>('/api/reports/config', {
      method: 'POST',
      body: payload,
    });
  },
};
