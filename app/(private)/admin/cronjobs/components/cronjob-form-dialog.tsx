"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Terminal,
  Link2,
  Loader2,
  Calendar,
  Plus,
  Trash2,
  Sliders,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CronJobSchedule {
  timezone: string;
  minutes: number[];
  hours: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
  expiresAt: number;
}

interface CronJobNotification {
  onFailure: boolean;
  onFailureCount: number;
  onSuccess: boolean;
  onDisable: boolean;
  onSslCertExpiry: boolean;
  onSslCertExpirySeconds: number;
}

interface CronJob {
  jobId: number;
  title: string;
  url: string;
  enabled: boolean;
  saveResponses: boolean;
  requestMethod: number;
  requestTimeout: number;
  redirectSuccess: boolean;
  lastStatus: number;
  lastDuration: number;
  lastExecution: number;
  nextExecution: number;
  schedule: CronJobSchedule;
  notification?: CronJobNotification;
  auth?: { enable: boolean; user?: string; password?: string };
  extendedData?: { headers?: Record<string, string>; body?: string };
}

// Hàm parse cron expression đơn giản sang cấu trúc mảng của cron-job.org
function parsePart(part: string, minVal: number, maxVal: number): number[] {
  if (part === "*") return [-1];
  if (part.startsWith("*/")) {
    const step = parseInt(part.substring(2), 10);
    if (isNaN(step) || step <= 0) return [-1];
    const arr: number[] = [];
    for (let i = minVal; i <= maxVal; i += step) {
      arr.push(i);
    }
    return arr;
  }
  if (part.includes(",")) {
    return part.split(",").map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));
  }
  if (part.includes("-")) {
    const [start, end] = part.split("-").map((x) => parseInt(x, 10));
    if (isNaN(start) || isNaN(end) || start > end) return [-1];
    const arr: number[] = [];
    for (let i = start; i <= end; i++) {
      arr.push(i);
    }
    return arr;
  }
  const val = parseInt(part, 10);
  return isNaN(val) ? [-1] : [val];
}

function parseCron(cron: string) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) {
    return { minutes: [0], hours: [-1], mdays: [-1], months: [-1], wdays: [-1] };
  }
  const minutes = parsePart(parts[0], 0, 59);
  const hours = parsePart(parts[1], 0, 23);
  const mdays = parsePart(parts[2], 1, 31);
  const months = parsePart(parts[3], 1, 12);
  let wdays = parsePart(parts[4], 0, 7);
  if (wdays.includes(7)) {
    wdays = Array.from(new Set(wdays.map((w) => (w === 7 ? 0 : w))));
  }
  return { minutes, hours, mdays, months, wdays };
}

interface ScheduleData {
  scheduleMonth?: number;
  scheduleDayOfMonth?: number;
  scheduleTimeHour?: number;
  scheduleTimeMinute?: number;
  scheduleEveryValue?: number;
  scheduleEveryUnit?: "minute" | "hour";
  cronExpression?: string;
}

// Hàm phân tích ngược từ mảng schedule của API về UI
function getScheduleTypeFromApi(schedule: CronJobSchedule | null | undefined): {
  type: "every_x" | "every_day" | "every_month" | "every_year" | "custom";
  data: ScheduleData;
} {
  if (!schedule) return { type: "every_x" as const, data: {} };
  const { minutes = [], hours = [], mdays = [], months = [], wdays = [] } = schedule;

  // 1. Check every year
  if (
    months.length === 1 &&
    months[0] !== -1 &&
    mdays.length === 1 &&
    mdays[0] !== -1 &&
    hours.length === 1 &&
    hours[0] !== -1 &&
    minutes.length === 1 &&
    minutes[0] !== -1
  ) {
    return {
      type: "every_year" as const,
      data: {
        scheduleMonth: months[0],
        scheduleDayOfMonth: mdays[0],
        scheduleTimeHour: hours[0],
        scheduleTimeMinute: minutes[0],
      },
    };
  }

  // 2. Check every month
  if (
    mdays.length === 1 &&
    mdays[0] !== -1 &&
    hours.length === 1 &&
    hours[0] !== -1 &&
    minutes.length === 1 &&
    minutes[0] !== -1 &&
    months.includes(-1)
  ) {
    return {
      type: "every_month" as const,
      data: {
        scheduleDayOfMonth: mdays[0],
        scheduleTimeHour: hours[0],
        scheduleTimeMinute: minutes[0],
      },
    };
  }

  // 3. Check every day
  if (
    hours.length === 1 &&
    hours[0] !== -1 &&
    minutes.length === 1 &&
    minutes[0] !== -1 &&
    mdays.includes(-1) &&
    months.includes(-1)
  ) {
    return {
      type: "every_day" as const,
      data: {
        scheduleTimeHour: hours[0],
        scheduleTimeMinute: minutes[0],
      },
    };
  }

  // 4. Check every X minutes or hours
  // Every X minutes
  if (hours.includes(-1) && mdays.includes(-1) && months.includes(-1) && wdays.includes(-1)) {
    if (minutes.includes(-1)) {
      return {
        type: "every_x" as const,
        data: { scheduleEveryValue: 1, scheduleEveryUnit: "minute" },
      };
    }
    if (minutes.length > 1) {
      const step = minutes[1] - minutes[0];
      return {
        type: "every_x" as const,
        data: { scheduleEveryValue: step, scheduleEveryUnit: "minute" },
      };
    }
  }

  // Every X hours
  if (minutes.length === 1 && minutes[0] === 0 && mdays.includes(-1) && months.includes(-1) && wdays.includes(-1)) {
    if (hours.includes(-1)) {
      return {
        type: "every_x" as const,
        data: { scheduleEveryValue: 1, scheduleEveryUnit: "hour" },
      };
    }
    if (hours.length > 1) {
      const step = hours[1] - hours[0];
      return {
        type: "every_x" as const,
        data: { scheduleEveryValue: step, scheduleEveryUnit: "hour" },
      };
    }
  }

  // 5. Custom Cron
  const formatPart = (arr: number[]) => {
    if (arr.includes(-1)) return "*";
    if (arr.length > 1) {
      const step = arr[1] - arr[0];
      let isStep = true;
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] - arr[i - 1] !== step) {
          isStep = false;
          break;
        }
      }
      if (isStep && arr[0] === 0) return `*/${step}`;
    }
    return arr.join(",");
  };

  const cronStr = `${formatPart(minutes)} ${formatPart(hours)} ${formatPart(mdays)} ${formatPart(months)} ${formatPart(wdays)}`;
  return {
    type: "custom" as const,
    data: { cronExpression: cronStr },
  };
}

// Định nghĩa Schema với Zod đầy đủ các trường nâng cao (dùng z.number() để tương thích resolver)
const cronJobSchema = z.object({
  // COMMON
  title: z.string().min(1, "Vui lòng nhập tên cron job"),
  url: z.string().url("Vui lòng nhập đúng định dạng URL"),
  enabled: z.boolean(),
  saveResponses: z.boolean(),

  // Execution schedule
  scheduleType: z.enum(["every_x", "every_day", "every_month", "every_year", "custom"]),
  scheduleEveryValue: z.number().min(1),
  scheduleEveryUnit: z.enum(["minute", "hour"]),
  scheduleTimeHour: z.number().min(0).max(23),
  scheduleTimeMinute: z.number().min(0).max(59),
  scheduleDayOfMonth: z.number().min(1).max(31),
  scheduleMonth: z.number().min(1).max(12),
  cronExpression: z.string(),

  // Expires
  timezone: z.string(),
  expiresAtEnabled: z.boolean(),
  expiresAtDate: z.string(),
  expiresAtTime: z.string(),

  // Notification
  notifyFailure: z.boolean(),
  notifyFailureCount: z.number().min(1),
  notifySuccess: z.boolean(),
  notifyDisable: z.boolean(),
  notifySslCert: z.boolean(),
  notifySslCertDays: z.number().min(0),

  // ADVANCED
  authEnable: z.boolean(),
  authUser: z.string(),
  authPassword: z.string(),

  requestMethod: z.number(),
  requestBody: z.string(),
  requestTimeout: z.number().min(1).max(300),
  redirectSuccess: z.boolean(),
});

type CronJobFormValues = z.infer<typeof cronJobSchema>;

interface CronJobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobToEdit?: CronJob | null;
}

export default function CronJobFormDialog({
  open,
  onOpenChange,
  jobToEdit,
}: CronJobFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!jobToEdit;
  const [activeTab, setActiveTab] = useState<"common" | "advanced">("common");
  
  // Custom Headers list
  const [headersList, setHeadersList] = useState<{ key: string; value: string }[]>([]);

  const form = useForm<CronJobFormValues>({
    resolver: zodResolver(cronJobSchema),
    defaultValues: {
      title: "",
      url: "",
      enabled: true,
      saveResponses: true,
      scheduleType: "every_x",
      scheduleEveryValue: 15,
      scheduleEveryUnit: "minute",
      scheduleTimeHour: 0,
      scheduleTimeMinute: 0,
      scheduleDayOfMonth: 1,
      scheduleMonth: 1,
      cronExpression: "*/15 * * * *",
      timezone: "Asia/Ho_Chi_Minh",
      expiresAtEnabled: false,
      expiresAtDate: "",
      expiresAtTime: "00:00",
      notifyFailure: false,
      notifyFailureCount: 1,
      notifySuccess: false,
      notifyDisable: true,
      notifySslCert: false,
      notifySslCertDays: 7,
      authEnable: false,
      authUser: "",
      authPassword: "",
      requestMethod: 0,
      requestBody: "",
      requestTimeout: 30,
      redirectSuccess: false,
    },
  });

  // Fetch predictions preview khi edit
  const { data: historyData } = useQuery({
    queryKey: ["admin", "cronjobs", jobToEdit?.jobId, "history-preview"],
    queryFn: async () => {
      if (!jobToEdit?.jobId) return null;
      const res = await fetch(`/api/admin/cronjobs/${jobToEdit.jobId}/history`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open && !!jobToEdit?.jobId,
  });

  const previewPredictions = historyData?.predictions || [];

  // Fetch chi tiết cronjob khi edit (để lấy auth và extendedData/headers)
  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ["admin", "cronjobs", jobToEdit?.jobId, "detail"],
    queryFn: async () => {
      if (!jobToEdit?.jobId) {
        throw new Error("Không có thông tin cron job để lấy chi tiết");
      }
      const res = await fetch(`/api/admin/cronjobs/${jobToEdit.jobId}`);
      if (!res.ok) {
        throw new Error("Không thể lấy thông tin chi tiết cron job");
      }
      const data = await res.json();
      return data.jobDetails;
    },
    enabled: open && !!jobToEdit?.jobId,
  });

  const activeJob = detailData || jobToEdit;

  // Reset form và load dữ liệu khi open hoặc edit thay đổi
  useEffect(() => {
    if (open) {
      setActiveTab("common");
      if (activeJob) {
        // Headers convert
        const hObj = activeJob.extendedData?.headers || {};
        const hdrs = Object.entries(hObj).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setHeadersList(hdrs);

        // Schedule parsing
        const sched = getScheduleTypeFromApi(activeJob.schedule);

        // Expires parsing
        let expEnabled = false;
        let expDate = "";
        let expTime = "00:00";
        if (activeJob.schedule?.expiresAt > 0) {
          const expStr = String(activeJob.schedule.expiresAt);
          if (expStr.length === 14) {
            expEnabled = true;
            expDate = `${expStr.substring(0, 4)}-${expStr.substring(4, 6)}-${expStr.substring(6, 8)}`;
            expTime = `${expStr.substring(8, 10)}:${expStr.substring(10, 12)}`;
          }
        }

        form.reset({
          title: activeJob.title || "",
          url: activeJob.url || "",
          enabled: activeJob.enabled ?? true,
          saveResponses: activeJob.saveResponses ?? true,
          scheduleType: sched.type,
          scheduleEveryValue: sched.data.scheduleEveryValue ?? 15,
          scheduleEveryUnit: sched.data.scheduleEveryUnit ?? "minute",
          scheduleTimeHour: sched.data.scheduleTimeHour ?? 0,
          scheduleTimeMinute: sched.data.scheduleTimeMinute ?? 0,
          scheduleDayOfMonth: sched.data.scheduleDayOfMonth ?? 1,
          scheduleMonth: sched.data.scheduleMonth ?? 1,
          cronExpression: sched.data.cronExpression || "*/15 * * * *",
          timezone: activeJob.schedule?.timezone || "Asia/Ho_Chi_Minh",
          expiresAtEnabled: expEnabled,
          expiresAtDate: expDate,
          expiresAtTime: expTime,
          notifyFailure: activeJob.notification?.onFailure ?? false,
          notifyFailureCount: activeJob.notification?.onFailureCount ?? 1,
          notifySuccess: activeJob.notification?.onSuccess ?? false,
          notifyDisable: activeJob.notification?.onDisable ?? true,
          notifySslCert: activeJob.notification?.onSslCertExpiry ?? false,
          notifySslCertDays: Math.floor((activeJob.notification?.onSslCertExpirySeconds || 604800) / 86400),
          authEnable: activeJob.auth?.enable ?? false,
          authUser: activeJob.auth?.user || "",
          authPassword: activeJob.auth?.password || "",
          requestMethod: activeJob.requestMethod ?? 0,
          requestBody: activeJob.extendedData?.body || "",
          requestTimeout: activeJob.requestTimeout ?? 30,
          redirectSuccess: activeJob.redirectSuccess ?? false,
        });
      } else {
        setHeadersList([]);
        form.reset({
          title: "",
          url: "",
          enabled: true,
          saveResponses: true,
          scheduleType: "every_x",
          scheduleEveryValue: 15,
          scheduleEveryUnit: "minute",
          scheduleTimeHour: 0,
          scheduleTimeMinute: 0,
          scheduleDayOfMonth: 1,
          scheduleMonth: 1,
          cronExpression: "*/15 * * * *",
          timezone: "Asia/Ho_Chi_Minh",
          expiresAtEnabled: false,
          expiresAtDate: "",
          expiresAtTime: "00:00",
          notifyFailure: false,
          notifyFailureCount: 1,
          notifySuccess: false,
          notifyDisable: true,
          notifySslCert: false,
          notifySslCertDays: 7,
          authEnable: false,
          authUser: "",
          authPassword: "",
          requestMethod: 0,
          requestBody: "",
          requestTimeout: 30,
          redirectSuccess: false,
        });
      }
    }
  }, [activeJob, open, form]);

  // Sinh đối tượng schedule API từ cấu hình form UI
  const getSchedulePayload = (values: CronJobFormValues) => {
    const defaultSchedule = {
      timezone: values.timezone,
      expiresAt: 0,
    };

    // Tính expiresAt
    if (values.expiresAtEnabled && values.expiresAtDate) {
      const cleanDate = values.expiresAtDate.replace(/-/g, ""); // YYYYMMDD
      const cleanTime = values.expiresAtTime.replace(/:/g, "") + "00"; // HHmmss
      defaultSchedule.expiresAt = Number(cleanDate + cleanTime);
    }

    if (values.scheduleType === "every_x") {
      const X = values.scheduleEveryValue;
      if (values.scheduleEveryUnit === "minute") {
        const minutes = X === 1 ? [-1] : Array.from({ length: Math.ceil(60 / X) }, (_, i) => i * X).filter((m) => m < 60);
        return {
          ...defaultSchedule,
          minutes,
          hours: [-1],
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        };
      } else {
        const hours = X === 1 ? [-1] : Array.from({ length: Math.ceil(24 / X) }, (_, i) => i * X).filter((h) => h < 24);
        return {
          ...defaultSchedule,
          minutes: [0],
          hours,
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        };
      }
    }

    if (values.scheduleType === "every_day") {
      return {
        ...defaultSchedule,
        minutes: [values.scheduleTimeMinute],
        hours: [values.scheduleTimeHour],
        mdays: [-1],
        months: [-1],
        wdays: [-1],
      };
    }

    if (values.scheduleType === "every_month") {
      return {
        ...defaultSchedule,
        minutes: [values.scheduleTimeMinute],
        hours: [values.scheduleTimeHour],
        mdays: [values.scheduleDayOfMonth],
        months: [-1],
        wdays: [-1],
      };
    }

    if (values.scheduleType === "every_year") {
      return {
        ...defaultSchedule,
        minutes: [values.scheduleTimeMinute],
        hours: [values.scheduleTimeHour],
        mdays: [values.scheduleDayOfMonth],
        months: [values.scheduleMonth],
        wdays: [-1],
      };
    }

    // Custom Cron expressions
    const cronData = parseCron(values.cronExpression);
    return {
      ...defaultSchedule,
      ...cronData,
    };
  };

  // Dynamic headers actions
  const handleAddHeader = () => {
    setHeadersList([...headersList, { key: "", value: "" }]);
  };

  const handleRemoveHeader = (idx: number) => {
    setHeadersList(headersList.filter((_, i) => i !== idx));
  };

  const handleHeaderChange = (idx: number, field: "key" | "value", val: string) => {
    const list = [...headersList];
    list[idx][field] = val;
    setHeadersList(list);
  };

  // Mutation lưu job
  const mutation = useMutation({
    mutationFn: async (values: CronJobFormValues) => {
      // 1. Chuyển đổi headers
      const headersObj: Record<string, string> = {};
      headersList.forEach((hdr) => {
        if (hdr.key.trim()) {
          headersObj[hdr.key.trim()] = hdr.value;
        }
      });

      // 2. Chuyển đổi schedule
      const schedule = getSchedulePayload(values);

      // 3. Đóng gói payload gửi lên API
      const payload = {
        job: {
          title: values.title,
          url: values.url,
          enabled: values.enabled,
          saveResponses: values.saveResponses,
          requestMethod: values.requestMethod,
          requestTimeout: values.requestTimeout,
          redirectSuccess: values.redirectSuccess,
          auth: {
            enable: values.authEnable,
            user: values.authUser,
            password: values.authPassword,
          },
          notification: {
            onFailure: values.notifyFailure,
            onFailureCount: values.notifyFailureCount,
            onSuccess: values.notifySuccess,
            onDisable: values.notifyDisable,
            onSslCertExpiry: values.notifySslCert,
            onSslCertExpirySeconds: values.notifySslCertDays * 86400,
          },
          extendedData: {
            headers: headersObj,
            body: values.requestBody,
          },
          schedule,
        },
      };

      const url = isEdit
        ? `/api/admin/cronjobs/${jobToEdit.jobId}`
        : "/api/admin/cronjobs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Có lỗi xảy ra khi lưu cron job");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cập nhật cron job thành công!" : "Tạo cron job thành công!");
      queryClient.invalidateQueries({ queryKey: ["admin", "cronjobs"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Không thể thực hiện tác vụ");
    },
  });

  const onSubmit = (values: CronJobFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-4xl sm:w-full gap-0 p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="border-b px-5 py-4 sm:px-6 shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold">
            {isEdit ? `Cập nhật Cronjob: ${jobToEdit?.title || "Backup"}` : "Tạo Cronjob Mới"}
          </DialogTitle>
        </DialogHeader>

        {/* Custom tabs */}
        <div className="flex border-b border-border/80 px-5 sm:px-6 shrink-0 bg-muted/10">
          <button
            type="button"
            onClick={() => setActiveTab("common")}
            className={cn(
              "px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "common"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/80 hover:text-foreground"
            )}
          >
            <Sliders className="size-3.5" />
            CƠ BẢN
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={cn(
              "px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-3 transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "advanced"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground/80 hover:text-foreground"
            )}
          >
            <Cpu className="size-3.5" />
            NÂNG CAO
          </button>
        </div>

        {/* Form */}
        {isEdit && isDetailLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 min-h-[300px]">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Đang tải cấu hình chi tiết từ cron-job.org...
            </p>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-6">
            
            {/* TAB COMMON */}
            <div className={cn("space-y-5", activeTab === "common" ? "block" : "hidden")}>
              
              {/* Tên & URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground/90">
                    Tên Cronjob
                  </Label>
                  <div className="relative">
                    <Terminal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50 text-muted-foreground" />
                    <Input
                      id="title"
                      placeholder="Ví dụ: Gửi thông báo nợ"
                      {...form.register("title")}
                      className="h-11 rounded-xl pl-9 bg-card border-border focus-visible:ring-primary focus-visible:ring-1"
                    />
                  </div>
                  {form.formState.errors.title && (
                    <p className="text-[10px] text-rose-500 font-medium">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="url" className="text-xs font-semibold text-muted-foreground/90">
                    Đường dẫn API (URL)
                  </Label>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50 text-muted-foreground" />
                    <Input
                      id="url"
                      placeholder="https://yourdomain.com/api/cron"
                      {...form.register("url")}
                      className="h-11 rounded-xl pl-9 bg-card border-border focus-visible:ring-primary focus-visible:ring-1"
                    />
                  </div>
                  {form.formState.errors.url && (
                    <p className="text-[10px] text-rose-500 font-medium">{form.formState.errors.url.message}</p>
                  )}
                </div>
              </div>

              {/* Switches cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/10">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="enabled" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Kích hoạt job
                    </Label>
                    <span className="text-[10px] text-muted-foreground/80">Cronjob sẽ chạy tự động theo lịch</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={form.watch("enabled")}
                      onChange={(e) => form.setValue("enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/10">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="saveResponses" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Lưu phản hồi
                    </Label>
                    <span className="text-[10px] text-muted-foreground/80">Lưu log chi tiết phản hồi API</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="saveResponses"
                      checked={form.watch("saveResponses")}
                      onChange={(e) => form.setValue("saveResponses", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                  </label>
                </div>
              </div>

              {/* Execution schedule & Next executions */}
              <div className="border border-border/80 rounded-2xl p-4.5 bg-card space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Cấu hình lịch chạy (Execution Schedule)
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Cấu hình bên trái */}
                  <div className="lg:col-span-2 space-y-3.5">
                    
                    {/* Option 1: Every X */}
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        id="type_every_x"
                        value="every_x"
                        checked={form.watch("scheduleType") === "every_x"}
                        onChange={() => form.setValue("scheduleType", "every_x")}
                        className="mt-1 size-4 cursor-pointer text-primary accent-primary"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="type_every_x" className="cursor-pointer font-medium text-foreground select-none">
                          Định kỳ mỗi
                        </label>
                        <Select
                          value={String(form.watch("scheduleEveryValue"))}
                          onValueChange={(v) => form.setValue("scheduleEveryValue", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_x"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 5, 10, 15, 20, 30].map((v) => (
                              <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={form.watch("scheduleEveryUnit")}
                          onValueChange={(v) => form.setValue("scheduleEveryUnit", v as "minute" | "hour")}
                          disabled={form.watch("scheduleType") !== "every_x"}
                        >
                          <SelectTrigger className="w-24 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minute">phút</SelectItem>
                            <SelectItem value="hour">giờ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Option 2: Every day at HH:MM */}
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        id="type_every_day"
                        value="every_day"
                        checked={form.watch("scheduleType") === "every_day"}
                        onChange={() => form.setValue("scheduleType", "every_day")}
                        className="mt-1 size-4 cursor-pointer text-primary accent-primary"
                      />
                      <div className="flex items-center gap-2">
                        <label htmlFor="type_every_day" className="cursor-pointer font-medium text-foreground select-none">
                          Hàng ngày vào lúc
                        </label>
                        <Select
                          value={String(form.watch("scheduleTimeHour"))}
                          onValueChange={(v) => form.setValue("scheduleTimeHour", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_day"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={String(form.watch("scheduleTimeMinute"))}
                          onValueChange={(v) => form.setValue("scheduleTimeMinute", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_day"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Option 3: Every Xth of the month */}
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        id="type_every_month"
                        value="every_month"
                        checked={form.watch("scheduleType") === "every_month"}
                        onChange={() => form.setValue("scheduleType", "every_month")}
                        className="mt-1 size-4 cursor-pointer text-primary accent-primary"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="type_every_month" className="cursor-pointer font-medium text-foreground select-none">
                          Hàng tháng vào ngày
                        </label>
                        <Select
                          value={String(form.watch("scheduleDayOfMonth"))}
                          onValueChange={(v) => form.setValue("scheduleDayOfMonth", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_month"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((v) => (
                              <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>lúc</span>
                        <Select
                          value={String(form.watch("scheduleTimeHour"))}
                          onValueChange={(v) => form.setValue("scheduleTimeHour", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_month"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={String(form.watch("scheduleTimeMinute"))}
                          onValueChange={(v) => form.setValue("scheduleTimeMinute", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_month"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Option 4: Every year on X Month */}
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        id="type_every_year"
                        value="every_year"
                        checked={form.watch("scheduleType") === "every_year"}
                        onChange={() => form.setValue("scheduleType", "every_year")}
                        className="mt-1 size-4 cursor-pointer text-primary accent-primary"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="type_every_year" className="cursor-pointer font-medium text-foreground select-none">
                          Hàng năm vào ngày
                        </label>
                        <Select
                          value={String(form.watch("scheduleDayOfMonth"))}
                          onValueChange={(v) => form.setValue("scheduleDayOfMonth", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_year"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((v) => (
                              <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>tháng</span>
                        <Select
                          value={String(form.watch("scheduleMonth"))}
                          onValueChange={(v) => form.setValue("scheduleMonth", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_year"}
                        >
                          <SelectTrigger className="w-28 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>lúc</span>
                        <Select
                          value={String(form.watch("scheduleTimeHour"))}
                          onValueChange={(v) => form.setValue("scheduleTimeHour", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_year"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>:</span>
                        <Select
                          value={String(form.watch("scheduleTimeMinute"))}
                          onValueChange={(v) => form.setValue("scheduleTimeMinute", Number(v))}
                          disabled={form.watch("scheduleType") !== "every_year"}
                        >
                          <SelectTrigger className="w-18 h-8 rounded-lg text-xs bg-muted/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => (
                              <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Option 5: Custom Crontab expression */}
                    <div className="flex items-start gap-2 text-sm pt-1">
                      <input
                        type="radio"
                        id="type_custom"
                        value="custom"
                        checked={form.watch("scheduleType") === "custom"}
                        onChange={() => form.setValue("scheduleType", "custom")}
                        className="mt-1 size-4 cursor-pointer text-primary accent-primary"
                      />
                      <div className="grid gap-1.5 flex-1 max-w-md">
                        <label htmlFor="type_custom" className="cursor-pointer font-medium text-foreground select-none">
                          Tùy chỉnh (Crontab expression)
                        </label>
                        <Input
                          placeholder="ví dụ: */15 * * * *"
                          {...form.register("cronExpression")}
                          disabled={form.watch("scheduleType") !== "custom"}
                          className="h-9 rounded-lg text-xs bg-muted/30"
                        />
                      </div>
                    </div>

                    {/* Expires date picker */}
                    <div className="pt-3 border-t border-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form.watch("expiresAtEnabled")}
                            onChange={(e) => form.setValue("expiresAtEnabled", e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                        </label>
                        <span className="text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => form.setValue("expiresAtEnabled", !form.watch("expiresAtEnabled"))}>
                          Đặt ngày hết hạn chạy
                        </span>
                      </div>
                      
                      {form.watch("expiresAtEnabled") && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="date"
                            {...form.register("expiresAtDate")}
                            className="h-8.5 rounded-lg border border-border bg-card px-2 text-xs font-medium text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                          <input
                            type="time"
                            {...form.register("expiresAtTime")}
                            className="h-8.5 rounded-lg border border-border bg-card px-2 text-xs font-medium text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Panel Next Executions bên phải */}
                  <div className="lg:col-span-1 bg-muted/10 rounded-xl p-3.5 border border-border/60 flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1 shrink-0">
                      <Calendar className="size-3.5 text-muted-foreground/60" /> Lịch chạy tiếp theo
                    </h5>
                    
                    <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 space-y-1">
                      {isEdit && previewPredictions.length > 0 ? (
                        previewPredictions.map((time: number, idx: number) => (
                          <div
                            key={idx}
                            className="text-[10px] py-1 px-2.5 rounded bg-background border border-muted/40 font-mono text-muted-foreground/90"
                          >
                            {format(new Date(time * 1000), "HH:mm:ss dd/MM/yyyy", { locale: vi })}
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-muted-foreground/60 italic text-center py-6">
                          {isEdit ? "Đang chờ tính lịch..." : "Sẽ tính lịch sau khi lưu"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notify me when... */}
              <div className="border border-border/80 rounded-2xl p-4.5 bg-card space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Cấu hình thông báo (Notify me when...)
                </h4>

                <div className="space-y-3.5">
                  {/* Failure notify */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-muted/20 pb-3">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.watch("notifyFailure")}
                          onChange={(e) => form.setValue("notifyFailure", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                      </label>
                      <span className="font-semibold text-foreground/95 select-none cursor-pointer" onClick={() => form.setValue("notifyFailure", !form.watch("notifyFailure"))}>
                        cuộc gọi cronjob bị thất bại
                      </span>
                    </div>

                    {form.watch("notifyFailure") && (
                      <div className="flex items-center gap-1.5 pl-12 sm:pl-0">
                        <span className="text-muted-foreground">Thông báo sau</span>
                        <Input
                          type="number"
                          min="1"
                          {...form.register("notifyFailureCount", { valueAsNumber: true })}
                          className="h-8 w-14 rounded-lg bg-muted/40 text-center font-bold"
                        />
                        <span className="text-muted-foreground">lần lỗi</span>
                      </div>
                    )}
                  </div>

                  {/* Success notify */}
                  <div className="flex items-center gap-3 text-xs border-b border-muted/20 pb-3">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.watch("notifySuccess")}
                        onChange={(e) => form.setValue("notifySuccess", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                    </label>
                    <span className="font-semibold text-foreground/95 select-none cursor-pointer" onClick={() => form.setValue("notifySuccess", !form.watch("notifySuccess"))}>
                      cuộc gọi cronjob thành công trở lại (sau khi đã lỗi trước đó)
                    </span>
                  </div>

                  {/* Disable notify */}
                  <div className="flex items-center gap-3 text-xs border-b border-muted/20 pb-3">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.watch("notifyDisable")}
                        onChange={(e) => form.setValue("notifyDisable", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                    </label>
                    <span className="font-semibold text-foreground/95 select-none cursor-pointer" onClick={() => form.setValue("notifyDisable", !form.watch("notifyDisable"))}>
                      cronjob bị tự động vô hiệu hóa (do lỗi quá nhiều lần)
                    </span>
                  </div>

                  {/* SSL Cert notify */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.watch("notifySslCert")}
                          onChange={(e) => form.setValue("notifySslCert", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-3.5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                      </label>
                      <span className="font-semibold text-foreground/95 select-none cursor-pointer" onClick={() => form.setValue("notifySslCert", !form.watch("notifySslCert"))}>
                        chứng chỉ bảo mật SSL/TLS của Server sắp hết hạn
                      </span>
                    </div>

                    {form.watch("notifySslCert") && (
                      <div className="flex items-center gap-1.5 pl-12 sm:pl-0">
                        <span className="text-muted-foreground">Thông báo trước</span>
                        <Input
                          type="number"
                          min="0"
                          {...form.register("notifySslCertDays", { valueAsNumber: true })}
                          className="h-8 w-14 rounded-lg bg-muted/40 text-center font-bold"
                        />
                        <span className="text-muted-foreground">ngày</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* TAB ADVANCED */}
            <div className={cn("space-y-5", activeTab === "advanced" ? "block" : "hidden")}>
              
              {/* Requires HTTP Auth */}
              <div className="border border-border/80 rounded-2xl p-4.5 bg-card space-y-4">
                <div className="flex items-center justify-between border-b border-muted/20 pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.watch("authEnable")}
                        onChange={(e) => form.setValue("authEnable", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                    </label>
                    <div className="flex flex-col gap-0.5 select-none cursor-pointer" onClick={() => form.setValue("authEnable", !form.watch("authEnable"))}>
                      <span className="text-sm font-semibold text-foreground">Yêu cầu xác thực HTTP (Basic Auth)</span>
                      <span className="text-[10px] text-muted-foreground/80">Nhập thông tin đăng nhập khi gọi API</span>
                    </div>
                  </div>
                </div>

                {form.watch("authEnable") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="grid gap-1">
                      <Label htmlFor="authUser" className="text-xs font-semibold text-muted-foreground/80">Username</Label>
                      <Input
                        id="authUser"
                        {...form.register("authUser")}
                        className="h-10 rounded-xl bg-card border-border"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="authPassword" className="text-xs font-semibold text-muted-foreground/80">Password</Label>
                      <Input
                        id="authPassword"
                        type="password"
                        {...form.register("authPassword")}
                        className="h-10 rounded-xl bg-card border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Headers */}
              <div className="border border-border/80 rounded-2xl p-4.5 bg-card space-y-4">
                <div className="flex justify-between items-center shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom HTTP Headers</h4>
                    <span className="text-[10px] text-muted-foreground/80">Truyền các headers tùy chỉnh kèm request</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddHeader}
                    className="rounded-lg h-8 px-2.5 font-bold cursor-pointer hover:bg-muted"
                  >
                    <Plus className="size-3.5 mr-1" /> Thêm Header
                  </Button>
                </div>

                {headersList.length === 0 ? (
                  <p className="text-xs text-muted-foreground/75 italic text-center py-4">Chưa cấu hình header nào.</p>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {headersList.map((hdr, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="Header Key (ví dụ: Authorization)"
                          value={hdr.key}
                          onChange={(e) => handleHeaderChange(idx, "key", e.target.value)}
                          className="h-9 rounded-lg bg-card text-xs flex-1 border-border"
                        />
                        <Input
                          placeholder="Header Value"
                          value={hdr.value}
                          onChange={(e) => handleHeaderChange(idx, "value", e.target.value)}
                          className="h-9 rounded-lg bg-card text-xs flex-1 border-border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveHeader(idx)}
                          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Request Method, Timezone, Timeout, Body */}
              <div className="border border-border/80 rounded-2xl p-4.5 bg-card space-y-4.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cấu hình nâng cao (Advanced Settings)</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Timezone */}
                  <div className="grid gap-1">
                    <Label htmlFor="timezone" className="text-xs font-semibold text-muted-foreground/85">Múi giờ (Time zone)</Label>
                    <Select
                      value={form.watch("timezone")}
                      onValueChange={(v) => form.setValue("timezone", v)}
                    >
                      <SelectTrigger id="timezone" className="h-10 rounded-xl bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (BST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Method */}
                  <div className="grid gap-1">
                    <Label htmlFor="requestMethod" className="text-xs font-semibold text-muted-foreground/85">Phương thức HTTP</Label>
                    <Select
                      value={String(form.watch("requestMethod"))}
                      onValueChange={(val) => form.setValue("requestMethod", Number(val))}
                    >
                      <SelectTrigger id="requestMethod" className="h-10 rounded-xl bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">GET</SelectItem>
                        <SelectItem value="1">POST</SelectItem>
                        <SelectItem value="4">PUT</SelectItem>
                        <SelectItem value="5">DELETE</SelectItem>
                        <SelectItem value="8">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timeout */}
                  <div className="grid gap-1">
                    <Label htmlFor="requestTimeout" className="text-xs font-semibold text-muted-foreground/85">Timeout (giây)</Label>
                    <Input
                      id="requestTimeout"
                      type="number"
                      min="1"
                      max="300"
                      {...form.register("requestTimeout", { valueAsNumber: true })}
                      className="h-10 rounded-xl bg-card border-border"
                    />
                  </div>
                </div>

                {/* Request Body (Hiển thị khi method không phải GET) */}
                {form.watch("requestMethod") !== 0 && (
                  <div className="grid gap-1">
                    <Label htmlFor="requestBody" className="text-xs font-semibold text-muted-foreground/85">Request body</Label>
                    <Textarea
                      id="requestBody"
                      placeholder="Dữ liệu JSON, Text gửi kèm request..."
                      {...form.register("requestBody")}
                      className="min-h-[90px] rounded-xl bg-card border-border resize-none"
                    />
                  </div>
                )}

                {/* Redirect success switch */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/10">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="redirectSuccess" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                      Chấp nhận mã chuyển hướng (HTTP 3xx)
                    </Label>
                    <span className="text-[10px] text-muted-foreground/80">Xem phản hồi 3xx Redirect là cuộc gọi thành công</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="redirectSuccess"
                      checked={form.watch("redirectSuccess")}
                      onChange={(e) => form.setValue("redirectSuccess", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors duration-200"></div>
                  </label>
                </div>
              </div>

            </div>

          </div>

          {/* Footer buttons */}
          <div className="border-t px-5 pt-4 pb-8 sm:py-4 sm:px-6 bg-muted/10 shrink-0 flex flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 cursor-pointer active:scale-95 transition-all"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl text-xs sm:text-sm h-9 sm:h-10 cursor-pointer active:scale-95 transition-all font-semibold"
            >
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo Job"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
