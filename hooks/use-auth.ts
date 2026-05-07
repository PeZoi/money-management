"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/browser";
import { mapSupabaseUserToSnapshot } from "@/lib/auth/map-supabase-user";
import type { CurrentUserSnapshot } from "@/types/user";
import { Session } from "@supabase/supabase-js";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: CurrentUserSnapshot | null;
  error: string | null;

  init: () => () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

let didInit = false;
let requestId = 0; // 🔥 chống race condition

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  error: null,

  // 🔥 function build user duy nhất
  init: () => {
    if (didInit) return () => { };
    didInit = true;

    const supabase = createClient();
    set({ status: "loading", error: null });

    const buildUser = async (session: Session | null) => {
      const currentRequest = ++requestId;

      if (!session?.user) {
        if (currentRequest !== requestId) return;
        set({
          user: null,
          status: "unauthenticated",
          error: null,
        });
        return;
      }

      const nextUser = mapSupabaseUserToSnapshot(session.user);
      if (currentRequest !== requestId) return;

      set({
        user: nextUser,
        status: "authenticated",
        error: null,
      });
    };

    // ✅ initial load (không gọi refresh nữa)
    supabase.auth.getSession().then(({ data }) => {
      buildUser(data.session);
    });

    // ✅ subscribe auth change
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      buildUser(session);
    });

    return () => {
      didInit = false;
      data.subscription.unsubscribe();
    };
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