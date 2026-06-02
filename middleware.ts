import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/auth/callback", "/api/health", "/api/telegram/webhook", "/api/telegram/backup/cron"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next internals/static
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Cho phép truy cập công khai các file tĩnh PWA, manifest và mọi biến thể apple-touch-icon của iOS
  const isPwaResource =
    pathname.startsWith("/manifest") ||
    pathname.includes("apple-touch-icon") ||
    pathname.includes("icon-app") ||
    pathname.endsWith(".webmanifest") ||
    pathname.endsWith(".json") ||
    pathname.startsWith("/favicon.ico");

  if (isPwaResource) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        error: "Missing Supabase env vars",
        missing: {
          NEXT_PUBLIC_SUPABASE_URL: !supabaseUrl,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_OR_ANON_KEY: !supabaseKey,
        },
      },
      { status: 500 },
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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

  let user: unknown = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch {
    user = null;
  }

  /** Tránh render `app/page.tsx` rồi mới redirect — chuyển thẳng sớm hơn. */
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

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

