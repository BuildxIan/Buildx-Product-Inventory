import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Server-side client used by server components and route handlers. It reads the
// same cookies the browser client writes, so `auth.getUser()` reflects the real
// session — never a value the browser could forge.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component: cookies are read-only there. The
          // middleware already refreshed the session, so this is safe to ignore.
        }
      },
    },
  });
}
