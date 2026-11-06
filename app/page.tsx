import { redirect } from "next/navigation";
import CatalogApp from "@/components/CatalogApp";
import { isConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  // Second line of defence behind the middleware: if this renders, we know the
  // visitor is authenticated before any catalog markup is produced.
  let authed = false;
  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    authed = true;
  }

  return <CatalogApp initialAuthed={authed} />;
}
