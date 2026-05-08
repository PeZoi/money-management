"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      if (data) {
        localStorage.setItem("auth_state", JSON.stringify(data));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full flex flex-1 items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chỉ hỗ trợ đăng nhập bằng Google.
        </p>

        <div className="mt-6 grid gap-3">
          <Button onClick={signInWithGoogle} disabled={loading} type="button">
            {loading ? "Đang chuyển hướng..." : "Đăng nhập với Google"}
          </Button>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Nếu đây là lần đầu, Supabase sẽ tự tạo user từ Google.
        </p>
      </div>
    </div>
  );
}

