"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { supabase, usernameToEmail } from "@/lib/supabase";

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
    <main className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #C9D3DE 1px, transparent 1px), linear-gradient(to bottom, #C9D3DE 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, #F86400 0%, transparent 70%)" }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-accent font-display text-2xl font-bold leading-none text-white">
              B
            </span>
            <div>
              <p className="font-display text-[26px] font-bold uppercase leading-none tracking-[0.2em] text-white">
                Buildx
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-ink-mist">
                Product Catalog
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="mb-6 h-1 w-12 rounded-full bg-accent" />
          <h1 className="font-display text-[40px] font-bold uppercase leading-[1.04] tracking-wide text-white xl:text-[46px]">
            Every product.
            <br />
            One catalog.
          </h1>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-ink-mist">
            Sign in to manage your building materials — products, photos, prices, categories and shops, all in
            one place.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mist">
          <ShieldCheck size={15} className="text-accent" />
          Authorized staff only
        </div>
      </aside>

      {/* Form side */}
      <div className="flex flex-1 flex-col bg-canvas">
        {/* Compact brand bar for phones and tablets */}
        <div className="flex items-center gap-2.5 bg-ink px-5 py-4 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-accent font-display text-lg font-bold leading-none text-white">
            B
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold uppercase leading-none tracking-[0.18em] text-white">
              Buildx
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-ink-mist">
              Product Catalog
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-[400px]">
            <div className="rounded-lg border border-ink-line bg-white p-5 shadow-panel sm:p-7">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">Sign in</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Use the catalog username and password you were given.
              </p>

              {!configured ? (
                <p className="mt-5 rounded border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] leading-relaxed text-danger">
                  Supabase is not configured. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                  <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
                  <code className="font-mono">.env.local</code>, then restart the server.
                </p>
              ) : (
                <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
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

            <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-ink-faint">
              Accounts are created by the catalog owner. There is no public sign-up.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
