"use client";

import { Moon, Sun } from "lucide-react";
import { toggleTheme } from "@/lib/theme";

type Props = {
  /** Overrides the default toolbar button styling. */
  className?: string;
};

const DEFAULT_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-ink-line bg-surface text-ink-soft transition-colors hover:border-ink-mist hover:bg-surface-alt hover:text-ink lg:h-11 lg:w-11";

/**
 * Light/dark switch.
 *
 * Both icons are always rendered and CSS picks one (`.dark` is on <html>), so
 * the server markup and the first client render are identical — no hydration
 * mismatch, and the icon is correct before any JavaScript runs.
 */
export default function ThemeToggle({ className }: Props) {
  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={className ?? DEFAULT_CLASS}
    >
      <Sun size={17} strokeWidth={1.9} className="hidden dark:block" />
      <Moon size={17} strokeWidth={1.9} className="block dark:hidden" />
    </button>
  );
}
