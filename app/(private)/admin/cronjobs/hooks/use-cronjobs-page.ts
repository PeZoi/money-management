"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CronJob } from "../types";

export function useCronJobsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Trạng thái Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);

  // Fetch danh sách cronjobs
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "cronjobs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/cronjobs");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể tải danh sách cron jobs");
      }
      return res.json();
    },
    retry: false,
  });

  // Mutation để bật/tắt nhanh status hoạt động của job
  const toggleMutation = useMutation({
    mutationFn: async ({ jobId, enabled }: { jobId: number; enabled: boolean }) => {
      const res = await fetch(`/api/admin/cronjobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: { enabled } }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Lỗi khi cập nhật trạng thái");
      }
      return res.json();
    },
    onMutate: async ({ jobId, enabled }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["admin", "cronjobs"] });
      const previousData = queryClient.getQueryData<{ jobs: CronJob[] }>(["admin", "cronjobs"]);

      if (previousData) {
        queryClient.setQueryData(["admin", "cronjobs"], {
          ...previousData,
          jobs: previousData.jobs.map((j: CronJob) =>
            j.jobId === jobId ? { ...j, enabled } : j
          ),
        });
      }
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["admin", "cronjobs"], context.previousData);
      }
      toast.error(err.message || "Thao tác thất bại");
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái cron job thành công!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cronjobs"] });
    },
  });

  // Mutation để xóa job
  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/admin/cronjobs/${jobId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể xóa cron job");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Xóa cron job thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin", "cronjobs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Xóa thất bại");
    },
  });

  // Mutation để chạy thử job ngay lập tức
  const runMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const res = await fetch(`/api/admin/cronjobs/${jobId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Không thể kích hoạt chạy thử");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Đã gửi yêu cầu chạy thử cron job!");
      queryClient.invalidateQueries({ queryKey: ["admin", "cronjobs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Chạy thử thất bại");
    },
  });

  const handleToggle = (jobId: number, currentStatus: boolean) => {
    toggleMutation.mutate({ jobId, enabled: !currentStatus });
  };

  const handleDelete = (jobId: number, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cron job "${title}" không?`)) {
      deleteMutation.mutate(jobId);
    }
  };

  const handleRunJob = (jobId: number) => {
    runMutation.mutate(jobId);
  };

  const handleEdit = (job: CronJob) => {
    setSelectedJob(job);
    setFormOpen(true);
  };

  const handleShowHistory = (job: CronJob) => {
    setSelectedJob(job);
    setHistoryOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedJob(null);
    setFormOpen(true);
  };

  // Sao chép đường dẫn API
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép đường dẫn API!");
  };

  // Lọc danh sách job theo từ khóa tìm kiếm
  const jobsList = (data?.jobs || []) as CronJob[];
  const filteredJobs = jobsList.filter(
    (job: CronJob) =>
      (job.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.url || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    searchTerm,
    setSearchTerm,
    formOpen,
    setFormOpen,
    historyOpen,
    setHistoryOpen,
    selectedJob,
    refetch,
    isLoading,
    isFetching,
    error: error as Error | null,
    jobsList,
    filteredJobs,
    handleToggle,
    handleDelete,
    handleEdit,
    handleShowHistory,
    handleCreateNew,
    handleCopyUrl,
    handleRunJob,
    isTogglePending: toggleMutation.isPending,
    isDeletePending: deleteMutation.isPending,
    isRunPending: runMutation.isPending,
  };
}
