import { createBrowserClient } from "@supabase/ssr";
import { BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL, isConfigured } from "./config";

// The browser client stores the session in cookies (not localStorage) so the
// server — middleware and server components — can validate it on every request.
// That is what makes the dashboard genuinely protected rather than just hidden.
export const supabase = createBrowserClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-key"
);

export { BUCKET, isConfigured, publicImageUrl as imageUrl, usernameToEmail } from "./config";
