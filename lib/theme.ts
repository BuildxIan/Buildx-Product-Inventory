/**
 * Theme handling.
 *
 * The applied theme is the `.dark` class on <html>. It is set before first
 * paint by a tiny inline script in `app/layout.tsx` (see `THEME_SCRIPT`), then
 * kept in sync by `ThemeToggle`.
 */

export const THEME_KEY = "buildx-theme";

export type Theme = "light" | "dark";

/** Saved choice, or null when the visitor has never toggled. */
export function getStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    // Private mode / blocked storage: fall back to the OS preference.
    return null;
  }
}

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Applies a theme and, unless told otherwise, remembers it. */
export function setTheme(theme: Theme, persist = true) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  if (persist) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Non-fatal: the theme still applies for this session.
    }
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

/**
 * Runs before paint. A saved choice wins; otherwise the OS preference is
 * followed so the first visit already matches the rest of the desktop.
 * Kept as a string because it has to be inlined into <head>.
 */
export const THEME_SCRIPT = `(function(){try{var k="${THEME_KEY}";var s=localStorage.getItem(k);var d=s==="dark"||(s===null&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;if(d)e.classList.add("dark");e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;
