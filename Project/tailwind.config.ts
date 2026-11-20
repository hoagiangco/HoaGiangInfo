import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          50: "#FAF7EE",
          100: "#F4EBD4",
          200: "#E6D3A7",
          300: "#D4BA79",
          400: "#BE9D4F",
          500: "#A38035",
          600: "#866526",
          700: "#684B1B",
          800: "#4D3613",
          900: "#33230C",
        },
        primary: {
          50: "#FAF7EE",
          100: "#F4EBD4",
          200: "#E6D3A7",
          300: "#D4BA79",
          400: "#BE9D4F",
          500: "#A38035",
          600: "#866526",
          700: "#684B1B",
          800: "#4D3613",
          900: "#33230C",
        },
        resort: {
          dark: "#0B1120",
          navy: "#0F172A",
          surface: "#1E293B",
          cardDark: "#151F32",
          borderDark: "#223147",
          ivory: "#FDFBF7",
          sand: "#F8F5EE",
          linen: "#F2EBE0",
          cream: "#EAE0CE",
          gold: "#C5A456",
          goldLight: "#E8D8B0",
          bronze: "#8C6D37",
        },
      },
      boxShadow: {
        'luxury': '0 10px 30px -5px rgba(134, 101, 38, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'luxury-hover': '0 20px 40px -8px rgba(134, 101, 38, 0.16), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'sidebar': '4px 0 24px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
