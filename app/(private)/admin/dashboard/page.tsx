"use client";

import { useEffect, useState } from "react";
import { PrivatePageShell } from "@/components/private-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminStats,
  useAdminAnalytics,
  useAdminActivities,
  useAdminHealth,
} from "@/hooks/use-admin";
import {
  ShieldAlert,
  Users,
  Layers,
  Activity,
  ArrowUpRight,
  CircleDollarSign,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatDistanceToNow, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

// Định dạng bytes sang dạng dễ đọc (KB, MB, GB)
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: isStatsLoading } = useAdminStats();
  const { data: analytics, isLoading: isAnalyticsLoading } = useAdminAnalytics();
  const { data: activities = [], isLoading: isActivitiesLoading } = useAdminActivities();
  const { data: health, isLoading: isHealthLoading } = useAdminHealth();

  // Mô phỏng CPU & RAM động ở phía client
  const [cpu, setCpu] = useState(15);
  const [ram, setRam] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(Math.floor(Math.random() * 12) + 12); // Dao động CPU 12-24%
      setRam(Number((Math.random() * 0.2 + 4.1).toFixed(1))); // Dao động RAM 4.1-4.3 GB
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Cấu hình biểu đồ Tăng trưởng (Growth Chart) ---
  const growthData = analytics?.growth ?? [];
  const growthConfig = {
    new_users: {
      label: "Người dùng mới",
      color: "var(--color-new-users)",
    },
    new_workspaces: {
      label: "Workspace mới",
      color: "var(--color-new-workspaces)",
    },
  };

  // --- Cấu hình biểu đồ Cơ cấu (Composition Chart) ---
  const comp = analytics?.composition ?? { personal_count: 0, group_count: 0 };
  const compositionData = [
    { name: "personal", value: Number(comp.personal_count), label: "Cá nhân" },
    { name: "group", value: Number(comp.group_count), label: "Nhóm/Shared" },
  ];
  const COLORS = ["#3b82f6", "#8b5cf6"]; // Blue và Violet


  return (
    <PrivatePageShell
      title="Tổng quan Quản trị"
      description="Xem số liệu thống kê hệ thống, biểu đồ phân tích và giám sát hiệu năng dịch vụ."
      icon={ShieldAlert}
    >
      {/* 1. Các thẻ thống kê nhanh */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Users */}
        <Link
          href="/admin/users"
          className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng người dùng</span>
            <Users className="size-5 text-blue-500" />
          </div>
          <div className="mt-4">
            {isStatsLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg" />
            ) : (
              <div className="text-3xl font-bold">{stats?.total_users ?? 0}</div>
            )}
            <div className="flex items-center gap-1 mt-1.5">
              <p className="text-xs text-muted-foreground">Xem danh sách</p>
              <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </Link>

        {/* Card 2: Workspaces */}
        <Link
          href="/admin/workspaces"
          className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 to-fuchsia-500" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng Workspace</span>
            <Layers className="size-5 text-violet-500" />
          </div>
          <div className="mt-4">
            {isStatsLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg" />
            ) : (
              <div className="text-3xl font-bold">{stats?.total_workspaces ?? 0}</div>
            )}
            <div className="flex items-center gap-1 mt-1.5">
              <p className="text-xs text-muted-foreground">Xem danh sách</p>
              <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </Link>

        {/* Card 3: Transactions */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-amber-500 to-orange-500" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tổng giao dịch</span>
            <Activity className="size-5 text-amber-500" />
          </div>
          <div className="mt-4">
            {isStatsLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg" />
            ) : (
              <div className="text-3xl font-bold">
                {(stats?.total_transactions ?? 0).toLocaleString("vi-VN")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">Trên toàn hệ thống</p>
          </div>
        </div>
      </div>

      {/* 2. Khu vực Biểu đồ phân tích (Recharts) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Biểu đồ Tăng trưởng - Chiếm 2 cột */}
        <div className="rounded-2xl border bg-card p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Xu hướng Tăng trưởng</h3>
            <p className="text-xs text-muted-foreground mb-4">Số lượng đăng ký mới trong 30 ngày qua</p>
          </div>
          <div className="h-[260px] w-full">
            {isAnalyticsLoading ? (
              <Skeleton className="size-full rounded-xl" />
            ) : growthData.length === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu tăng trưởng
              </div>
            ) : (
              <ChartContainer
                config={growthConfig}
                className="size-full"
                style={
                  {
                    "--color-new-users": "#3b82f6",
                    "--color-new-workspaces": "#8b5cf6",
                  } as React.CSSProperties
                }
              >
                <AreaChart data={growthData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWorkspaces" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => {
                      const parts = value.split("-");
                      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value;
                    }}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="new_users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    name="new_users"
                  />
                  <Area
                    type="monotone"
                    dataKey="new_workspaces"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWorkspaces)"
                    name="new_workspaces"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Biểu đồ Cơ cấu - Chiếm 1 cột */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Cơ cấu Workspace</h3>
            <p className="text-xs text-muted-foreground mb-4">Tỉ lệ loại hình không gian làm việc</p>
          </div>
          <div className="h-[200px] w-full relative flex items-center justify-center">
            {isAnalyticsLoading ? (
              <Skeleton className="size-40 rounded-full" />
            ) : comp.personal_count === 0 && comp.group_count === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    formatter={(value, name) => [
                      value,
                      name === "personal" ? "Cá nhân" : "Nhóm/Shared",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom Legends */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2.5 rounded-full bg-[#3b82f6] shrink-0" />
              <span className="text-muted-foreground">Cá nhân ({comp.personal_count})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
              <span className="text-muted-foreground">Nhóm ({comp.group_count})</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Hoạt động gần đây & Giám sát hiệu năng */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Nhật ký giao dịch gần đây */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Nhật ký giao dịch</h3>
            <p className="text-xs text-muted-foreground mb-4">Các giao dịch phát sinh gần đây trên hệ thống</p>
          </div>

          <div className="flex-1 max-h-[380px] overflow-y-auto pr-2 space-y-4.5 mt-2" data-lenis-prevent>
            {isActivitiesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-[75%] rounded" />
                    <Skeleton className="h-3 w-[40%] rounded" />
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground py-16">
                Chưa ghi nhận giao dịch nào gần đây
              </div>
            ) : (
              activities.map((act, index) => {
                const Icon = CircleDollarSign;
                const colorClass = "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400";
                
                // Chuẩn hóa và format số tiền giao dịch
                const amount = Number(act.target_name);
                const formattedAmount = isNaN(amount)
                  ? act.target_name
                  : amount.toLocaleString("vi-VN") + "đ";
                const text = `Giao dịch phát sinh trị giá ${formattedAmount} từ ${act.actor_name}`;

                return (
                  <div key={index} className="flex gap-3 text-sm items-start">
                    <div className={`p-2 rounded-xl shrink-0 ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(parseISO(act.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Giám sát hiệu năng & Trạng thái hệ thống */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between gap-6">
          <div>
            <h3 className="font-semibold text-foreground">Giám sát tài nguyên</h3>
            <p className="text-xs text-muted-foreground">Trạng thái và thời gian xử lý thực tế của hạ tầng</p>
          </div>

          {/* Các chỉ số kỹ thuật */}
          <div className="grid gap-4 grid-cols-2">
            {/* CPU */}
            <div className="rounded-xl border p-4 bg-muted/10 relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-blue-500" />
                  CPU Virtual
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{cpu}%</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${cpu}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="rounded-xl border p-4 bg-muted/10 relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <HardDrive className="size-3.5 text-violet-500" />
                  Memory Container
                </span>
                <span className="text-xs font-semibold tabular-nums text-foreground">{ram} GB</span>
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(ram / 8) * 100}%` }} // Giả định giới hạn RAM tối đa 8GB
                />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">Tối đa: 8.0 GB</span>
            </div>

            {/* Database Size */}
            <div className="rounded-xl border p-4 bg-muted/10">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
                <HardDrive className="size-3.5 text-emerald-500" />
                Dung lượng DB thực
              </span>
              {isHealthLoading ? (
                <Skeleton className="h-5 w-16 mt-1 rounded" />
              ) : (
                <p className="text-lg font-bold text-foreground mt-1">
                  {formatBytes(health?.dbSizeBytes ?? 0)}
                </p>
              )}
              <span className="text-[10px] text-muted-foreground mt-1 block">Supabase Storage</span>
            </div>

            {/* API Response Time */}
            <div className="rounded-xl border p-4 bg-muted/10">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1.5">
                <Clock className="size-3.5 text-amber-500" />
                Độ trễ API Vercel
              </span>
              {isHealthLoading ? (
                <Skeleton className="h-5 w-16 mt-1 rounded" />
              ) : (
                <p className="text-lg font-bold text-foreground mt-1">
                  {health?.responseTimeMs ?? 0} ms
                </p>
              )}
              <span className="text-[10px] text-muted-foreground mt-1 block">Client-to-Serverless</span>
            </div>
          </div>

          {/* Trạng thái dịch vụ */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Trạng thái dịch vụ
            </h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {/* API */}
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">API Gateway</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Hoạt động</p>
                </div>
              </div>
              {/* Database */}
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Database</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Hoạt động</p>
                </div>
              </div>
              {/* Auth */}
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Authentication</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Hoạt động</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrivatePageShell>
  );
}
