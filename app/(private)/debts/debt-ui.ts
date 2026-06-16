export function normalizeText(s: string) {
  try {
    return s
      .normalize("NFD")
      .replace(/\p{M}+/gu, "")
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

export function formatVnd(amount: number | string) {
  const numeric = Number(amount);
  if (isNaN(numeric)) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numeric);
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface DueStatus {
  days: number;
  label: string;
  variant: "warning" | "destructive" | "success" | "info" | "secondary";
  badgeClass: string;
  textClass: string;
}

export function getDueStatus(dueAtStr: string, status: "pending" | "paid"): DueStatus {
  if (status === "paid") {
    return {
      days: 0,
      label: "Đã trả xong",
      variant: "success",
      badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      textClass: "text-emerald-600 dark:text-emerald-400",
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const due = new Date(dueAtStr);
  const dueDate = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      days: 0,
      label: "Đến hạn hôm nay",
      variant: "warning",
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      textClass: "text-amber-600 dark:text-amber-400 font-semibold",
    };
  } else if (diffDays < 0) {
    return {
      days: diffDays,
      label: `Quá hạn ${Math.abs(diffDays)} ngày`,
      variant: "destructive",
      badgeClass: "border-destructive/30 bg-destructive/10 text-destructive dark:text-red-400",
      textClass: "text-destructive dark:text-red-400 font-bold",
    };
  } else {
    return {
      days: diffDays,
      label: `Còn ${diffDays} ngày`,
      variant: "info",
      badgeClass: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      textClass: "text-muted-foreground",
    };
  }
}
