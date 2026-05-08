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

  signOut: async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ error: error.message });
      return;
    }

    set({
      user: null,
      status: "unauthenticated",
      error: null,
    });

    localStorageFn.removeLocalStorageItem(localStorageFn.AUTH_KEY.USER);
    cookieStore.delete("sb-jcrytweuxovtwejovjjh-auth-token.0")
    cookieStore.delete("sb-jcrytweuxovtwejovjjh-auth-token.1")

    // ✅ client-safe redirect
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
  const signOut = useAuthStore((s) => s.signOut);

  return { status, user, error, init, refresh, signOut };
}