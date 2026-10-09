/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Yesplis-inspired minimalist palette
        "navy": "#1e266d",
        "navy-light": "#2d3a8c",
        "navy-dark": "#141c52",
        "sky": "#4f8cff",
        "sky-light": "#e8f0ff",
        "mint": "#00c48c",
        "mint-light": "#e6faf3",
        "coral": "#ff5757",
        "coral-light": "#fff0f0",
        "amber": "#ffb800",
        "amber-light": "#fff8e6",
        "slate-50": "#f8fafc",
        "slate-100": "#f1f5f9",
        "slate-200": "#e2e8f0",
        "slate-300": "#cbd5e1",
        "slate-400": "#94a3b8",
        "slate-500": "#64748b",
        "slate-600": "#475569",
        "slate-700": "#334155",
        "slate-800": "#1e293b",
        "slate-900": "#0f172a",
      },
      fontFamily: {
        "sans": ["Poppins", "system-ui", "-apple-system", "sans-serif"],
        "mono": ["Roboto Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.04)",
        "elevated": "0 20px 40px rgba(0,0,0,0.08)",
        "soft": "0 2px 8px rgba(30,38,109,0.08)",
      },
    },
  },
  plugins: [],
};
