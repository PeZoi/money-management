"use client";

import { PrivatePageShell } from "@/components/private-page-shell";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { SettingsIcon } from "lucide-react";

const PRESETS: Array<{ name: string; value: string }> = [
  { name: "Xanh lá", value: "#16a34a" },
  { name: "Xanh dương", value: "#2563eb" },
  { name: "Tím", value: "#7c3aed" },
  { name: "Cam", value: "#ea580c" },
  { name: "Đỏ", value: "#dc2626" },
  { name: "Đen", value: "#171717" },
];

export default function SettingsPage() {
  const { theme, setPrimary, resetPrimary } = useTheme();
  const color = theme.primary || "#16a34a";

  return (
    <PrivatePageShell
      title="Cài đặt"
      description="Tùy chỉnh màu chủ đạo của ứng dụng."
      icon={SettingsIcon}
      contentClassName="max-w-3xl"
      headerActions={
        <Button variant="outline" onClick={resetPrimary} type="button">
          Reset
        </Button>
      }
    >
      <div className="mt-8 grid gap-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium">Màu chủ đạo</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPrimary(p.value);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.value }} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Chọn màu</span>
                <input
                  aria-label="Chọn màu chủ đạo"
                  type="color"
                  value={color}
                  onChange={(e) => {
                    setPrimary(e.target.value);
                  }}
                  className="h-9 w-14 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <code className="rounded-md bg-muted px-2 py-1 text-xs">{color}</code>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preview</span>
                <Button type="button">Primary</Button>
                <Button type="button" variant="outline">
                  Outline
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-medium">Trạng thái</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                --primary
              </span>
              <span className="text-xs text-muted-foreground">Giá trị hiện tại: </span>
              <code className="text-xs">{theme.primary || color}</code>
            </div>
          </section>
        </div>
    </PrivatePageShell>
  );
}

