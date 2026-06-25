import type { Config } from "tailwindcss";

/**
 * Bajaj Life — AI Platform design tokens.
 * Light / corporate. Navy + bright blue on an off-white canvas.
 * Semantic names so components never hard-code hex values.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        navy: {
          DEFAULT: "#002c6e", // headings, logo, primary text
          800: "#012a5e",
          900: "#001a42",
        },
        brand: {
          DEFAULT: "#0072ce", // accent — buttons, links, focus
          hover: "#005ba1",
          soft: "#eaf1fb", // light wash surface
          glow: "rgba(0,114,206,0.15)",
        },
        // Neutrals
        ink: {
          DEFAULT: "#0f172a", // body text
          muted: "#51607a", // secondary copy (AA on white + sunken)
          subtle: "#586882", // tertiary copy — darkened to meet WCAG AA (4.5:1)
        },
        surface: {
          DEFAULT: "#ffffff", // cards
          sunken: "#f4f7fb", // page background
        },
        line: {
          DEFAULT: "rgba(0,44,110,0.10)",
          strong: "rgba(0,44,110,0.16)",
        },
        // Status — DEFAULT is the vivid dot/graphic color; `text` is the AA-safe
        // on-light text shade used by soft/outline badges (4.5:1+).
        ok: { DEFAULT: "#1f8e3a", soft: "rgba(31,142,58,0.12)", text: "#147233" },
        warn: { DEFAULT: "#f59e0b", soft: "rgba(245,158,11,0.14)", text: "#8a5300" },
        down: { DEFAULT: "#d32f2f", soft: "rgba(211,47,47,0.12)", text: "#b3261e" },
        idle: { DEFAULT: "#7787a3", soft: "rgba(119,135,163,0.14)", text: "#51607a" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        e1: "0 1px 2px rgba(0,44,110,0.06), 0 1px 1px rgba(0,44,110,0.04)",
        e2: "0 4px 14px rgba(0,44,110,0.08), 0 2px 4px rgba(0,44,110,0.05)",
        e3: "0 18px 48px rgba(0,44,110,0.14), 0 8px 16px rgba(0,44,110,0.08)",
        focus: "0 0 0 3px rgba(0,114,206,0.45)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.55", transform: "scale(0.82)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.8s ease-in-out infinite",
        fadeUp: "fadeUp 0.5s ease both",
      },
    },
  },
  plugins: [],
} satisfies Config;
