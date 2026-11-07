import type { Config } from "tailwindcss";

/**
 * Design tokens sampled from buildx.ph (live computed styles):
 * ink #112538, accent #F86400, canvas #F5F6F8, line #DDE2E8,
 * radii 6px (controls) / 8px (panels) / 12px (modals).
 *
 * Every colour is a CSS variable holding raw RGB channels, so the palette can
 * be swapped wholesale by `.dark` in `app/globals.css` without touching a single
 * component class name. Channels (not hex) keep Tailwind's `/opacity` modifiers
 * working — `border-ink/25`, `bg-ink/45` and friends still resolve.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          deep: "rgb(var(--ink-deep) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
          line: "rgb(var(--ink-line) / <alpha-value>)",
          mist: "rgb(var(--ink-mist) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover: "rgb(var(--accent-hover) / <alpha-value>)",
          deep: "rgb(var(--accent-deep) / <alpha-value>)",
        },
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          alt: "rgb(var(--surface-alt) / <alpha-value>)",
        },
        /** The navy masthead / brand band. Stays dark in both themes. */
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          fg: "rgb(var(--brand-fg) / <alpha-value>)",
        },
        /** Primary filled button; inverts in dark mode so it stays readable. */
        solid: {
          DEFAULT: "rgb(var(--solid) / <alpha-value>)",
          hover: "rgb(var(--solid-hover) / <alpha-value>)",
          fg: "rgb(var(--solid-fg) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          hover: "rgb(var(--danger-hover) / <alpha-value>)",
          soft: "rgb(var(--danger-soft) / <alpha-value>)",
          /* Filled destructive button — kept dark enough for white text in both themes. */
          solid: "rgb(var(--danger-solid) / <alpha-value>)",
          "solid-hover": "rgb(var(--danger-solid-hover) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-barlow)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["var(--font-barlow-condensed)", "var(--font-barlow)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        modal: "var(--shadow-modal)",
        panel: "var(--shadow-panel)",
        well: "var(--shadow-well)",
        rail: "var(--shadow-rail)",
        solid: "var(--shadow-solid)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        pop: {
          from: { opacity: "0", transform: "translateY(18px) scale(0.97) rotateX(7deg)" },
          to: { opacity: "1", transform: "translateY(0) scale(1) rotateX(0deg)" },
        },
      },
      animation: {
        rise: "rise 0.34s cubic-bezier(0.22, 0.61, 0.36, 1) both",
        fade: "fade 0.2s ease-out both",
        pop: "pop 0.22s cubic-bezier(0.22, 0.61, 0.36, 1) both",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
