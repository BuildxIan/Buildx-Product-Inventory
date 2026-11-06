// Plain, dependency-free configuration shared by server and client code.
//
// Kept separate from `lib/supabase.ts` on purpose: the Supabase browser client
// touches `document`, so server components must never import that module. This
// one only reads public environment variables, so both sides can use it.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const BUCKET = "product-images";

/** Public URL for a stored object. Same shape as `storage.getPublicUrl()`. */
export function publicImageUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encoded}`;
}

const domain = process.env.NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN || "catalog.app";

/** The username field maps to a hidden email: "buildx" -> "buildx@catalog.app". */
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${domain}`;
