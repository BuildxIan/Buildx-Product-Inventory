import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isConfigured = Boolean(url && anon);

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-key"
);

export const BUCKET = "product-images";

export function imageUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

const domain = process.env.NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN || "catalog.app";
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${domain}`;
