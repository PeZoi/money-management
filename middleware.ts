import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/auth/callback", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next internals/static
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow /login for signed-out users; redirect signed-in users away from /login
  if (pathname === "/login") {
    if (user) {
      const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";
      return NextResponse.redirect(new URL(next, request.url));
    }
    return response;
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

