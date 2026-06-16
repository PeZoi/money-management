import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import {
  debtDefaultValues,
  type DebtFormValues,
  debtSchema,
} from "@/lib/validations/debt-schema";
import { DebtRow } from "@/types/database";
import { useWorkspaceStore } from "./use-workspace";
import { formatAmountInput, parseAmount } from "@/lib/validations/transaction-schema";

/**
 * Hook chuyên xử lý việc lấy danh sách người nợ (GET)
 */
export function useDebts() {
  const { activeWorkspaceId } = useWorkspaceStore();

  const { data: debts = [], isLoading, refetch } = useQuery<DebtRow[]>({
    queryKey: ["debts", activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const res = await fetch(`/api/debts?workspace_id=${activeWorkspaceId}`);
      if (!res.ok) throw new Error("Không thể tải danh sách người nợ");
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!activeWorkspaceId,
  });

  return {
    debts,
    isLoading,
    fetchDebts: refetch,
  };
}

/**
 * Hook chuyên xử lý việc thêm/sửa/xóa nợ (POST/PATCH/DELETE)
 */
export function useDebtMutation() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      payload,
      options,
    }: {
      payload: Record<string, unknown>;
      options?: {
        debtId?: string;
        isUpdate?: boolean;
        workspaceId?: string;
        onSuccess?: () => void;
        onError?: (err: Error) => void;
      };
    }) => {
      const { debtId, isUpdate, workspaceId } = options || {};
      const finalWorkspaceId = workspaceId || activeWorkspaceId;

      if (!isUpdate && !finalWorkspaceId) {
        throw new Error("Lỗi hệ thống: Không xác định được workspace đang hoạt động.");
      }

      const url = isUpdate ? `/api/debts/${debtId}` : "/api/debts";
      const method = isUpdate ? "PATCH" : "POST";

      const finalPayload = { ...payload };
      if (!isUpdate) {
        finalPayload.workspace_id = finalWorkspaceId;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Đã có lỗi xảy ra");
      }

      return result;
    },
    onMutate: async (variables) => {
      const { payload, options } = variables;
      const isUpdate = options?.isUpdate;
      const debtId = options?.debtId;
      const finalWorkspaceId = options?.workspaceId || activeWorkspaceId;

      // Hủy các query fetch debts đang chạy
      await queryClient.cancelQueries({ queryKey: ["debts", finalWorkspaceId] });

      // Chụp snapshot cache cũ
      const previousDebts = queryClient.getQueryData<DebtRow[]>(["debts", finalWorkspaceId]);

      if (isUpdate && debtId) {
        // Cập nhật lạc quan phần tử cũ
        queryClient.setQueryData<DebtRow[]>(["debts", finalWorkspaceId], (old) => {
          if (!old) return [];
          return old.map((debt) => (debt.id === debtId ? { ...debt, ...payload } : debt));
        });
      } else {
        // Thêm lạc quan phần tử mới giả lập
        const optimisticDebt: DebtRow = {
          id: `temp-debt-${Date.now()}`,
          workspace_id: finalWorkspaceId!,
          debtor_name: payload.debtor_name as string,
          amount: payload.amount as number,
          borrowed_at: (payload.borrowed_at as string) || new Date().toISOString(),
          due_at: (payload.due_at as string) || new Date().toISOString(),
          status: (payload.status as "pending" | "paid") || "pending",
          note: (payload.note as string) || null,
          notified: (payload.notified as boolean) || false,
          created_by: "temp-user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<DebtRow[]>(["debts", finalWorkspaceId], (old) => {
          return old ? [...old, optimisticDebt] : [optimisticDebt];
        });
      }

      return { previousDebts, finalWorkspaceId };
    },
    onSuccess: (data, variables) => {
      const isUpdate = variables.options?.isUpdate;
      toast.success(isUpdate ? "Đã cập nhật thông tin người nợ thành công" : "Đã ghi nhận người nợ thành công");
      variables.options?.onSuccess?.();
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(["debts", context.finalWorkspaceId], context.previousDebts);
      }
      const message = error.message || "Không thể lưu thông tin";
      toast.error(message);
      variables.options?.onError?.(error);
    },
    onSettled: (data, error, variables, context) => {
      const finalWorkspaceId = context?.finalWorkspaceId || variables.options?.workspaceId || activeWorkspaceId;
      queryClient.invalidateQueries({
        queryKey: ["debts", finalWorkspaceId],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Xóa thất bại");
      }
      return true;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["debts", activeWorkspaceId] });
      const previousDebts = queryClient.getQueryData<DebtRow[]>(["debts", activeWorkspaceId]);

      // Xóa lạc quan khỏi cache
      queryClient.setQueryData<DebtRow[]>(["debts", activeWorkspaceId], (old) => {
        if (!old) return [];
        return old.filter((d) => d.id !== id);
      });

      return { previousDebts };
    },
    onError: (err: Error, id, context) => {
      if (context?.previousDebts) {
        queryClient.setQueryData(["debts", activeWorkspaceId], context.previousDebts);
      }
      toast.error(err.message || "Không thể xóa thông tin người nợ");
    },
    onSuccess: () => {
      toast.success("Đã xóa thông tin người nợ thành công");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["debts", activeWorkspaceId],
      });
    },
  });

  const saveDebt = async (
    payload: Record<string, unknown>,
    options?: {
      debtId?: string;
      isUpdate?: boolean;
      workspaceId?: string;
      onSuccess?: () => void;
      onError?: (err: Error) => void;
    }
  ) => {
    try {
      await mutation.mutateAsync({ payload, options });
      return true;
    } catch {
      return false;
    }
  };

  const deleteDebt = async (id: string, options?: { onSuccess?: () => void }) => {
    try {
      await deleteMutation.mutateAsync(id);
      options?.onSuccess?.();
      return true;
    } catch {
      return false;
    }
  };

  return {
    isSubmitting: mutation.isPending || deleteMutation.isPending,
    saveDebt,
    deleteDebt,
  };
}

/**
 * Hook quản lý toàn bộ state và logic submit của form nợ
 */
export function useDebtForm(options: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtId?: string;
  initialData?: {
    debtor_name: string;
    amount: number;
    borrowed_at: string;
    due_at: string;
    note?: string;
    status?: "pending" | "paid";
  };
  workspaceId?: string;
  onSuccess?: () => void;
}) {
  const { open, onOpenChange, debtId, initialData, workspaceId, onSuccess } = options;
  const isUpdate = !!debtId;
  const { isSubmitting, saveDebt } = useDebtMutation();

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema) as unknown as Resolver<DebtFormValues>,
    defaultValues: initialData
      ? {
          debtor_name: initialData.debtor_name,
          amount: formatAmountInput(initialData.amount.toString()),
          borrowed_at: initialData.borrowed_at.split("T")[0],
          due_at: initialData.due_at.split("T")[0],
          note: initialData.note || "",
        }
      : debtDefaultValues,
  });

  // Reset form khi dialog mở hoặc initialData thay đổi
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);

    if (open) {
      form.reset(
        initialData
          ? {
              debtor_name: initialData.debtor_name,
              amount: formatAmountInput(initialData.amount.toString()),
              borrowed_at: initialData.borrowed_at.split("T")[0],
              due_at: initialData.due_at.split("T")[0],
              note: initialData.note || "",
            }
          : debtDefaultValues
      );
    }
  }

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();

    // Kiểm tra ngày hẹn trả không được nhỏ hơn ngày mượn tiền
    const borrowDate = new Date(data.borrowed_at.split("T")[0]);
    const dueDate = new Date(data.due_at.split("T")[0]);
    if (dueDate < borrowDate) {
      form.setError("due_at", {
        type: "manual",
        message: "Ngày hẹn trả không được nhỏ hơn ngày mượn tiền",
      });
      return;
    }

    const numAmt = parseAmount(data.amount);
    if (numAmt <= 0) {
      form.setError("amount", {
        type: "manual",
        message: "Số tiền phải lớn hơn 0",
      });
      return;
    }

    const payload: Record<string, unknown> = {
      debtor_name: data.debtor_name.trim(),
      amount: numAmt,
      borrowed_at: new Date(data.borrowed_at).toISOString(),
      due_at: new Date(data.due_at).toISOString(),
      note: data.note?.trim() || null,
    };

    if (isUpdate && initialData?.status) {
      payload.status = initialData.status;
    }

    await saveDebt(payload, {
      debtId,
      isUpdate,
      workspaceId,
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return {
    form,
    isSubmitting,
    isUpdate,
    handleSubmit,
  };
}
