import { redirect } from "next/navigation";
import type { Metadata } from "next";
import LoginPage from "@/components/LoginPage";
import { isConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Sign in · Product Catalog",
};

/** Only allow same-origin relative paths, so `?next=` can't be an open redirect. */
function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return "/";
  return raw;
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/");
  }

  const params = await searchParams;

  return <LoginPage configured={isConfigured} next={safeNext(params.next)} />;
}
