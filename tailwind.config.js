/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        touch: "var(--touch-target)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          primary: "#007BFF",
          secondary: "#00D492",
          dark: "#0F172A",
          light: "#F1F5F9",
        },
        night: {
          950: "#05080f",
          900: "#0a0f1a",
          850: "#0d1424",
          800: "#121a2e",
          700: "#1a2540",
          600: "#243352",
        },
        charcoal: {
          950: "#0c0c0e",
          900: "#141418",
          800: "#1c1c22",
        },
        electric: {
          DEFAULT: "#00b4ff",
          dim: "#0090d0",
          glow: "#38c6ff",
          blue: "#0070F3",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        bento: "20px",
      },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
      boxShadow: {
        glow: "0 0 24px rgba(0, 180, 255, 0.25)",
        "glow-sm": "0 0 12px rgba(0, 180, 255, 0.2)",
        "input-focus": "0 0 0 1px rgba(0, 180, 255, 0.45), 0 0 20px rgba(0, 180, 255, 0.15)",
      },
      backgroundImage: {
        "grid-night": "linear-gradient(to right, rgba(0, 180, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 180, 255, 0.03) 1px, transparent 1px)",
      },
      keyframes: {
        "landing-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "mesh-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(2%, -1%) scale(1.02)" },
          "66%": { transform: "translate(-1%, 2%) scale(0.98)" },
        },
      },
      animation: {
        "landing-marquee": "landing-marquee 45s linear infinite",
        "mesh-drift": "mesh-drift 28s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
