"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Images,
  Loader2,
  Lock,
  ShieldCheck,
  Store,
  Tags,
  User,
} from "lucide-react";
import { supabase, usernameToEmail } from "@/lib/supabase";
import ThemeToggle from "./ThemeToggle";

type Props = {
  /** False when the Supabase env vars are missing — show setup help instead. */
  configured: boolean;
  /** Where to land after signing in (already validated as a relative path). */
  next: string;
};

/** Turns Supabase's raw messages into something a shopkeeper can act on. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect username or password.";
  if (m.includes("email not confirmed")) return "This account has not been confirmed yet.";
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Cannot reach the server. Check your internet connection and try again.";
  }
  return message;
}

/** The three things the catalog actually does, used as proof on the brand panel. */
const FEATURES = [
  { icon: Tags, label: "Products, prices and codes", note: "One record per item" },
  { icon: Images, label: "Multiple photos per product", note: "Plus shareable detail cards" },
  { icon: Store, label: "Categories and shops", note: "Filter the catalog instantly" },
];

export default function LoginPage({ configured, next }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setBusy(true);
    setError("");
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (authError) {
      setError(friendly(authError.message));
      setBusy(false);
      return;
    }

    // Cookies are set by the browser client; a replace + refresh re-renders the
    // protected route on the server with the new session.
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ---------------- Brand panel (desktop) ---------------- */}
      {/* The panel follows the theme so the matching lockup stays legible:
          white surface + navy mark in light mode, dark surface + white mark
          in dark mode. */}
      <aside className="relative hidden overflow-hidden border-r border-ink-line bg-surface px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-12">
        {/* Faint blueprint grid, tinted from the ink token so it adapts. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(var(--ink) / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--ink) / 0.04) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full opacity-[0.13] blur-[2px] dark:opacity-20"
          style={{ background: "radial-gradient(circle, #F86400 0%, transparent 68%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full opacity-[0.10] dark:opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #7FB4E8 0%, transparent 70%)" }}
        />

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Light.png"
            alt="BuildX"
            width={1912}
            height={648}
            className="h-11 w-auto dark:hidden xl:h-12"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Dark.png"
            alt="BuildX"
            width={1958}
            height={670}
            className="hidden h-11 w-auto dark:block xl:h-12"
          />
        </div>

        <div className="relative max-w-lg">
          <div className="mb-6 h-1 w-12 rounded-full bg-accent" />
          <h1 className="font-display text-[42px] font-bold uppercase leading-[1.03] tracking-wide text-ink xl:text-[52px]">
            Every product.
            <br />
            One catalog.
          </h1>
          <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-ink-soft">
            Manage your building materials — products, photos, prices, categories and shops — from a
            single organized catalog.
          </p>

          <ul className="mt-9 space-y-3.5">
            {FEATURES.map(({ icon: Icon, label, note }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-ink/[0.06] text-accent">
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-tight text-ink">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-tight text-ink-faint">{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          <ShieldCheck size={15} className="text-accent" />
          Authorized staff only
        </div>
      </aside>

      {/* ---------------- Form side ---------------- */}
      <div className="flex flex-1 flex-col">
        {/* Compact brand band for phones and tablets */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-line bg-surface px-4 py-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Light.png"
            alt="BuildX"
            width={1912}
            height={648}
            className="h-9 w-auto dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/BuildX_Logo_Dark.png"
            alt="BuildX"
            width={1958}
            height={670}
            className="hidden h-9 w-auto dark:block"
          />
          <ThemeToggle className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-ink-line text-ink-soft transition-colors hover:bg-surface-alt hover:text-ink" />
        </div>

        <div className="hidden justify-end px-6 pt-6 lg:flex xl:px-10 xl:pt-8">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-8">
          <div className="w-full max-w-[420px]">
            <div className="rounded-xl border border-ink-line bg-surface p-6 shadow-modal sm:p-8">
              <p className="eyebrow">Welcome back</p>
              <h2 className="mt-2 font-display text-[26px] font-bold uppercase leading-none tracking-wide text-ink sm:text-[28px]">
                Sign in
              </h2>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                Use the catalog username and password you were given.
              </p>

              {!configured ? (
                <p className="mt-6 rounded border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] leading-relaxed text-danger">
                  Supabase is not configured. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
                  and <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                  <code className="font-mono">.env.local</code>, then restart the server.
                </p>
              ) : (
                <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label className="label" htmlFor="username">
                      Username
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                      />
                      <input
                        id="username"
                        name="username"
                        className="input h-11 pl-9 text-[15px]"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (error) setError("");
                        }}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        autoFocus
                        aria-invalid={Boolean(error)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                      />
                      <input
                        id="password"
                        name="password"
                        className="input h-11 pl-9 pr-11 text-[15px]"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError("");
                        }}
                        autoComplete="current-password"
                        aria-invalid={Boolean(error)}
                      />
                      <button
                        type="button"
                        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] leading-relaxed text-danger"
                    >
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}

                  <button className="btn-accent h-11 w-full text-[15px]" disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>
              )}
            </div>

            <p className="mt-5 px-2 text-center text-[11px] leading-relaxed text-ink-faint">
              Accounts are created by the catalog owner. There is no public sign-up.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
