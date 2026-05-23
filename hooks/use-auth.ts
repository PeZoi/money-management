"use client";

import localStorageFn from "@/functions/localstorage-fn";
import { mapSupabaseUserToSnapshot } from "@/lib/auth/map-supabase-user";
import { createClient } from "@/lib/supabase/browser";
import type { CurrentUserSnapshot } from "@/types/user";
import { create } from "zustand";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: CurrentUserSnapshot | null;
  error: string | null;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

let didInit = false;

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  error: null,

  init: async () => {
    if (didInit) return;
    set({ status: "loading" });

    const userLocal = localStorageFn.getLocalStorageItem(localStorageFn.AUTH_KEY.USER);

    if (userLocal) {
      set({ user: JSON.parse(userLocal), status: "authenticated" });
      didInit = true;
      return;
    } else {
      try {
        const response = await fetch('/api/user/get-current-user');
        const result = await response.json();
        if (response.ok && result.data) {
          set({ user: result.data, status: "authenticated" });
          localStorageFn.setLocalStorageItem(localStorageFn.AUTH_KEY.USER, JSON.stringify(result.data));
        } else {
          set({ user: null, status: "unauthenticated" });
          localStorageFn.removeLocalStorageItem(localStorageFn.AUTH_KEY.USER);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
        set({ user: null, status: "unauthenticated", error: "Failed to fetch user" });
      } finally {
        didInit = true;
      }
    }
  },

  refresh: async () => {
    const supabase = createClient();
    set({ status: "loading", error: null });

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      set({
        user: null,
        status: "unauthenticated",
        error: error.message,
      });
      return;
    }

    const session = data.session;

    if (!session?.user) {
      set({
        user: null,
        status: "unauthenticated",
        error: null,
      });
      return;
    }

    const nextUser = mapSupabaseUserToSnapshot(session.user);

    set({
      user: nextUser,
      status: "authenticated",
      error: null,
    });
  },

  refreshUser: async () => {
    try {
      const response = await fetch('/api/user/get-current-user');
      const result = await response.json();
      if (response.ok && result.data) {
        set({ user: result.data, status: "authenticated" });
        localStorageFn.setLocalStorageItem(localStorageFn.AUTH_KEY.USER, JSON.stringify(result.data));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  },

  signOut: async () => {
    // Gọi API signOut của Supabase ở chế độ chạy ngầm (không await) để tránh chặn luồng chính
    const supabase = createClient();
    supabase.auth.signOut().catch((err) => {
      console.error("Supabase signOut error (background):", err);
    });

    // Xoá ngay lập tức trạng thái đăng nhập cục bộ
    set({
      user: null,
      status: "unauthenticated",
      error: null,
    });

    localStorageFn.removeLocalStorageItem(localStorageFn.AUTH_KEY.USER);
    
    // Xóa cookie token của Supabase ngay lập tức
    if (typeof document !== "undefined") {
      document.cookie = "sb-jcrytweuxovtwejovjjh-auth-token.0=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "sb-jcrytweuxovtwejovjjh-auth-token.1=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    }

    // ✅ client-safe redirect tức thì
    window.location.href = "/login";
  },
}));

// ✅ hook tiện dụng
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const init = useAuthStore((s) => s.init);
  const refresh = useAuthStore((s) => s.refresh);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const signOut = useAuthStore((s) => s.signOut);

  return { status, user, error, init, refresh, refreshUser, signOut };
}