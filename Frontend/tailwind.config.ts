import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
          /* JadeNode Kinetic brand */
          brand: "#FFBF00",
          "brand-dark": "#FFA500",
          glow: "rgba(255, 191, 0, 0.2)",
        },
        surface: {
          DEFAULT: "#1A1600",
          elevated: "#241F00",
          glass: "rgba(25, 20, 0, 0.4)",
          "glass-border": "rgba(255, 191, 0, 0.08)",
        },
        background: {
          DEFAULT: "#0D0B00",
        },
        foreground: {
          DEFAULT: "#F5F5F0",
          muted: "rgba(245, 245, 240, 0.6)",
          dim: "rgba(245, 245, 240, 0.4)",
        },
        success: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        error: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        info: {
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        status: {
          available: "#22c55e",
          limited: "#f59e0b",
          waitlist: "#3b82f6",
          unavailable: "#ef4444",
        },
      },
      spacing: {
        "4.5": "1.125rem",
        "13": "3.25rem",
        "15": "3.75rem",
        "18": "4.5rem",
        "88": "22rem",
        "112": "28rem",
        "128": "32rem",
        "144": "36rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.3)",
        "card-hover":
          "0 10px 25px -5px rgba(255, 191, 0, 0.08), 0 0 40px rgba(255, 191, 0, 0.04)",
        elevated:
          "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
        glow: "0 0 30px rgba(255, 191, 0, 0.15)",
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
