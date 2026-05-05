import { CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseKey, getSupabaseUrl } from "./env";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      async getAll() {
        return (await cookieStore).getAll() ?? [];
      },
      async setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(async ({ name, value, options }) => {
            (await cookieStore).set(name, value, options as CookieOptions);
          });
        } catch {
          // Server Components cannot set cookies; Route Handlers can.
        }
      },
    },
  });
}

