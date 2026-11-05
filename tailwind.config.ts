import type { Config } from "tailwindcss";

/**
 * Design tokens sampled from buildx.ph (live computed styles):
 * ink #112538, accent #F86400, canvas #F5F6F8, line #DDE2E8,
 * radii 6px (controls) / 8px (panels) / 12px (modals).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#112538",
          deep: "#0B1A28",
          soft: "#4A5868",
          faint: "#8B98A7",
          line: "#DDE2E8",
          mist: "#C9D3DE",
        },
        accent: {
          DEFAULT: "#F86400",
          hover: "#E05A00",
          deep: "#C2410C",
        },
        canvas: "#F5F6F8",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#EEF1F4",
        },
        danger: {
          DEFAULT: "#B42318",
          hover: "#911B12",
          soft: "#FEF3F2",
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
        card: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(17, 37, 56, 0.06), 0 6px 14px -8px rgba(17, 37, 56, 0.20), 0 18px 32px -24px rgba(17, 37, 56, 0.30)",
        lift: "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 3px 6px rgba(17, 37, 56, 0.07), 0 14px 26px -12px rgba(17, 37, 56, 0.26), 0 36px 60px -30px rgba(17, 37, 56, 0.38)",
        modal:
          "inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 2px 6px rgba(11, 26, 40, 0.08), 0 18px 40px -16px rgba(11, 26, 40, 0.30), 0 50px 100px -40px rgba(11, 26, 40, 0.55)",
        panel: "0 1px 3px rgba(17, 37, 56, 0.06)",
        well: "inset 0 2px 6px rgba(17, 37, 56, 0.10), inset 0 0 0 1px rgba(17, 37, 56, 0.04)",
        rail: "6px 0 24px -18px rgba(17, 37, 56, 0.35)",
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
