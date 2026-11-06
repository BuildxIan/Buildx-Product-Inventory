import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

/**
 * Login-first gate.
 *
 * Runs on the server before any page renders, so an unauthenticated visitor
 * never receives dashboard HTML — not even for one frame. `auth.getUser()` asks
 * Supabase to verify the JWT, which also refreshes an expired session and
 * re-writes the cookies on the way out.
 */
export async function middleware(request: NextRequest) {
  // Without credentials the app shows its setup screen; nothing to protect yet.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === "/login" || pathname.startsWith("/login/");

  // Already signed in: the login page has nothing to offer.
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Remember where they were heading so login can send them back.
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

/** Keeps any refreshed auth cookies when we turn the response into a redirect. */
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
