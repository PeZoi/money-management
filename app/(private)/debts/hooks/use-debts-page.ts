import { useDebts, useDebtMutation } from "@/hooks/use-debts";
import { useConfirm } from "@/hooks/use-confirm";
import type { DebtRow } from "@/types/database";
import { useMemo, useState } from "react";
import { normalizeText } from "../debt-ui";

export function useDebtsPage() {
  const { debts, isLoading, fetchDebts } = useDebts();
  const { deleteDebt, saveDebt, isSubmitting } = useDebtMutation();
  const confirm = useConfirm();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Xử lý xóa khoản nợ
  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Xóa khoản nợ",
      message: "Bạn có chắc chắn muốn xóa thông tin ghi chú nợ này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteDebt(id);
      await fetchDebts();
    } finally {
      setDeletingId(null);
    }
  };

  // Cập nhật nhanh trạng thái đã trả / chưa trả
  const handleToggleStatus = async (debt: DebtRow) => {
    const nextStatus = debt.status === "pending" ? "paid" : "pending";

    setUpdatingStatusId(debt.id);
    try {
      await saveDebt(
        { status: nextStatus },
        {
          debtId: debt.id,
          isUpdate: true,
          onSuccess: () => {
            fetchDebts();
          },
        }
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Tính toán thống kê tiền nợ
  const stats = useMemo(() => {
    let pending = 0;
    let paid = 0;

    for (const d of debts) {
      const amt = Number(d.amount);
      if (d.status === "pending") {
        pending += amt;
      } else {
        paid += amt;
      }
    }

    return {
      totalPendingAmount: pending,
      totalPaidAmount: paid,
    };
  }, [debts]);

  // Lọc và sắp xếp người nợ
  const filtered = useMemo(() => {
    const q = normalizeText(query);
    const result = debts.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!q) return true;
      const hay = normalizeText(`${d.debtor_name} ${d.note ?? ""}`);
      return hay.includes(q);
    });

    // Sắp xếp: pending (chưa trả) lên trước, paid (đã trả) ra sau.
    // Đối với pending, ưu tiên sắp xếp theo hạn trả (due_at) tăng dần (sắp đến hạn/quá hạn lên trước)
    // Đối với paid, sắp xếp theo thời gian cập nhật mới nhất (updated_at) giảm dần
    return result.sort((a, b) => {
      if (a.status === "pending" && b.status === "paid") return -1;
      if (a.status === "paid" && b.status === "pending") return 1;

      if (a.status === "pending" && b.status === "pending") {
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [query, statusFilter, debts]);

  return {
    debts,
    isLoading: isLoading || updatingStatusId !== null,
    deletingId,
    fetchDebts,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    createOpen,
    setCreateOpen,
    editingDebt,
    setEditingDebt,
    filtered,
    stats,
    handleDelete,
    handleToggleStatus,
    isSubmitting,
  };
}
