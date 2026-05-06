"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/browser";
import { mapSupabaseUserToSnapshot } from "@/lib/auth/map-supabase-user";
import type { CurrentUserSnapshot } from "@/types/user";
import { redirect } from "next/navigation";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: CurrentUserSnapshot | null;
  error: string | null;

  /** Call once in a client root (e.g. sidebar/header) */
  init: () => () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

let didInit = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  user: null,
  error: null,

  init: () => {
    if (didInit) return () => {};
    didInit = true;

    const supabase = createClient();
    set({ status: "loading", error: null });

    // Initial load
    void get().refresh();

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ? mapSupabaseUserToSnapshot(session.user) : null;
      set({
        user: nextUser,
        status: nextUser ? "authenticated" : "unauthenticated",
        error: null,
      });
    });

    return () => {
      didInit = false;
      data.subscription.unsubscribe();
    };
  },

  refresh: async () => {
    const supabase = createClient();
    set({ status: "loading", error: null });

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      set({ user: null, status: "unauthenticated", error: error.message });
      return;
    }

    const nextUser = data.user ? mapSupabaseUserToSnapshot(data.user) : null;
    set({
      user: nextUser,
      status: nextUser ? "authenticated" : "unauthenticated",
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
    set({ user: null, status: "unauthenticated", error: null });
    redirect('/login');
    cookieStore.delete('sb-jcrytweuxovtwejovjjh-auth-token.0');
    cookieStore.delete('sb-jcrytweuxovtwejovjjh-auth-token.1');
  },
}));

/** Convenience hook */
export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);
  const init = useAuthStore((s) => s.init);
  const refresh = useAuthStore((s) => s.refresh);
  const signOut = useAuthStore((s) => s.signOut);

  return { status, user, error, init, refresh, signOut };
}

