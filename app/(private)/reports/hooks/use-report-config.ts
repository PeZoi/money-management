'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';

import type {
  ReportConfigRow,
  ReportTable,
} from '@/types/report';
import { useWorkspaceStore } from '@/hooks/use-workspace';

// ─── Fetch cấu hình báo cáo ──────────────────────────

export function useReportConfig(month: string) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const {
    data: configData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery<{
    data: ReportConfigRow | null;
    cloned: boolean;
  }>({
    queryKey: ['report-config', activeWorkspaceId, month],
    queryFn: async () => {
      if (!activeWorkspaceId || !month) return { data: null, cloned: false };
      const res = await fetch(
        `/api/reports/config?workspace_id=${activeWorkspaceId}&month=${month}`,
      );
      if (!res.ok) throw new Error('Không thể tải cấu hình báo cáo');
      return res.json();
    },
    enabled: !!activeWorkspaceId && !!month,
  });

  // ─── Mutation lưu cấu hình ─────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (tables: ReportTable[]) => {
      if (!activeWorkspaceId) throw new Error('Không xác định workspace');
      const res = await fetch('/api/reports/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          month,
          tables,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lưu cấu hình thất bại');
      return json;
    },
    onSuccess: () => {
      // Invalidate query để refetch dữ liệu mới nhất
      queryClient.invalidateQueries({
        queryKey: ['report-config', activeWorkspaceId, month],
      });
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
