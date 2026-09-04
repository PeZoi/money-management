'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';

import type {
  ReportTable,
} from '@/types/report';
import { useWorkspaceStore } from '@/hooks/use-workspace';
import {
  reportsApi,
  reportKeys,
  type GetReportConfigResponse,
} from '@/lib/api/reports';

// ─── Fetch cấu hình báo cáo ──────────────────────────

export function useReportConfig(month: string) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const {
    data: configData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery<GetReportConfigResponse>({
    queryKey: reportKeys.config(activeWorkspaceId, month),
    queryFn: async () => {
      if (!activeWorkspaceId || !month) return { data: null, cloned: false };
      return reportsApi.getConfig(activeWorkspaceId, month);
    },
    enabled: !!activeWorkspaceId && !!month,
  });

  // ─── Mutation lưu cấu hình ─────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (tables: ReportTable[]) => {
      if (!activeWorkspaceId) throw new Error('Không xác định workspace');
      return reportsApi.saveConfig({
        workspace_id: activeWorkspaceId,
        month,
        tables,
      });
    },
    onSuccess: (json) => {
      // Cập nhật cache React Query ngay lập tức với dữ liệu mới từ server
      queryClient.setQueryData(reportKeys.config(activeWorkspaceId, month), {
        data: json.data,
        cloned: false
      });
      // Invalidate query để đảm bảo đồng bộ ngầm
      queryClient.invalidateQueries({
        queryKey: reportKeys.config(activeWorkspaceId, month),
      });
      toast.success('Đã lưu cấu hình báo cáo thành công');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể lưu cấu hình báo cáo');
    },
  });

  // ─── Auto-save với debounce ────────────────────────

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveTablesDebounced = useCallback(
    (tables: ReportTable[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        saveMutation.mutate(tables);
      }, 800);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorkspaceId, month],
  );

  const saveTablesImmediate = useCallback(
    (tables: ReportTable[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      saveMutation.mutate(tables);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorkspaceId, month],
  );

  // Memoize để tránh tạo mảng mới gây re-render vòng lặp vô hạn ở Component sử dụng
  const tables = useMemo(() => {
    return (configData?.data?.tables ?? []) as ReportTable[];
  }, [configData?.data?.tables]);

  return {
    config: configData?.data ?? null,
    tables,
    isCloned: configData?.cloned ?? false,
    isLoading,
    isSuccess,
    isSaving: saveMutation.isPending,
    saveTablesDebounced,
    saveTablesImmediate,
    refetch,
  };
}
