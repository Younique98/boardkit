import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // BoardKit design tokens - kept in sync with the CSS custom
        // properties defined in app/globals.css (light + dark values).
        "bk-bg": "var(--bk-bg)",
        "bk-surface": "var(--bk-surface)",
        "bk-ink": "var(--bk-ink)",
        "bk-ink-muted": "var(--bk-ink-muted)",
        "bk-border": "var(--bk-border)",
        "bk-accent": "var(--bk-accent)",
        "bk-accent-ink": "var(--bk-accent-ink)",
        "bk-signal": "var(--bk-signal)",
        "bk-signal-ink": "var(--bk-signal-ink)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
