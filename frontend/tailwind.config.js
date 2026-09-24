/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ── Tipografia ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "Inter", "ui-sans-serif", "sans-serif"],
      },

      // ── Paleta AgroVia ────────────────────────────────────────────────────
      colors: {
        agrovia: {
          cream: "#F4F0E6",
          sidebar: "#0F1A10",
          operational: "#3A7D44",
          soil: "#C89A6B",
          "soil-ink": "#3A2712",
        },
        // Verde tecnológico escuro (base da identidade)
        brand: {
          50:  "#f0fdf6",
          100: "#dcfcec",
          200: "#bbf7d8",
          300: "#86efba",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#064e3b", // Emerald-900 — cor principal
          950: "#022c22",
        },
        // Neutros refinados (base de texto e superfícies)
        surface: {
          50:  "#f8fafc", // Slate-50
          100: "#f1f5f9", // Slate-100 — contraste principal
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a", // Slate-900 — texto escuro
          950: "#020617",
        },
        // Azul-aço para destaques secundários (dados, gráficos, sensores)
        accent: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
      },

      // ── Glassmorphism tokens ──────────────────────────────────────────────
      backdropBlur: {
        xs:  "2px",
        sm:  "8px",
        md:  "16px",
        lg:  "24px",
        xl:  "40px",
        "2xl": "64px",
      },

      // ── Border radius suave/moderno ───────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ── Shadows para cards glass ──────────────────────────────────────────
      boxShadow: {
        glass:
          "0 8px 32px 0 rgba(6, 78, 59, 0.12), 0 1px 0 0 rgba(255,255,255,0.15) inset",
        "glass-sm":
          "0 4px 16px 0 rgba(6, 78, 59, 0.10), 0 1px 0 0 rgba(255,255,255,0.12) inset",
        "glass-dark":
          "0 8px 32px 0 rgba(0,0,0,0.28), 0 1px 0 0 rgba(255,255,255,0.08) inset",
      },

      // ── Gradientes base ───────────────────────────────────────────────────
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
        "gradient-surface":
          "linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
      },
    },
  },
  plugins: [],
};