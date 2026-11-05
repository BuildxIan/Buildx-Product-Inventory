"use client";

import { useState } from "react";
import { Lock, Package, ShieldCheck, User } from "lucide-react";
import Modal from "./Modal";
import { supabase, usernameToEmail } from "@/lib/supabase";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setBusy(false);
    if (error) setError(error.message);
    else onClose();
  }

  return (
    <Modal onClose={onClose} size="md">
      <div className="grid sm:grid-cols-[1fr_1.1fr]">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-6 text-white sm:flex">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #C9D3DE 1px, transparent 1px), linear-gradient(to bottom, #C9D3DE 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded bg-accent text-white">
                <Package size={18} />
              </span>
              <span className="font-display text-lg font-bold uppercase tracking-wide">Catalog</span>
            </div>
            <h2 className="mt-8 font-display text-[26px] font-bold uppercase leading-[1.1] tracking-wide">
              Manage your
              <br />
              building materials
            </h2>
            <p className="mt-3 max-w-[24ch] text-[13px] leading-relaxed text-ink-mist">
              Sign in to add products, edit prices and keep every category up to date.
            </p>
          </div>
          <div className="relative mt-8 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mist">
            <ShieldCheck size={14} className="text-accent" />
            Admin access only
          </div>
        </div>

        {/* Form panel */}
        <div className="p-6 sm:p-7">
          <div className="mb-5 pr-10 sm:pr-8">
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink">Admin login</h2>
            <p className="mt-1 text-[13px] text-ink-faint">Use your catalog username and password.</p>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="label" htmlFor="login-username">
                Username
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="login-username"
                  className="input pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoCapitalize="none"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="login-password"
                  className="input pl-9"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            )}

            <button className="btn-accent w-full" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
