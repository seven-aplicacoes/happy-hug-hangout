import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Motiva Sans"', "system-ui", "sans-serif"],
        editorial: ['"Instrument Serif"', '"Times New Roman"', "serif"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.05", fontWeight: "100", letterSpacing: "-0.02em" }],
        "display-lg": ["2.625rem", { lineHeight: "1.1", fontWeight: "100", letterSpacing: "-0.015em" }],
        "display-md": ["2rem", { lineHeight: "1.15", fontWeight: "100", letterSpacing: "-0.01em" }],
        "title-lg": ["1.875rem", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.01em" }],
        "title-md": ["1.5rem", { lineHeight: "1.25", fontWeight: "700", letterSpacing: "-0.005em" }],
        "title-sm": ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        "label-caps": ["0.75rem", { lineHeight: "1.4", fontWeight: "700", letterSpacing: "0.175em" }],
      },
      letterSpacing: {
        "caps-sm": "0.15em",
        "caps-md": "0.175em",
        "caps-lg": "0.225em",
      },
      colors: {
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        seven: {
          // Operational
          success: "hsl(var(--seven-success))",
          warning: "hsl(var(--seven-warning))",
          danger: "hsl(var(--seven-danger))",
          info: "hsl(var(--seven-info))",
          // Neutral scale
          ink: "hsl(var(--seven-ink))",
          graphite: "hsl(var(--seven-graphite))",
          charcoal: "hsl(var(--seven-charcoal))",
          stone: "hsl(var(--seven-stone))",
          slate: "hsl(var(--seven-slate))",
          pewter: "hsl(var(--seven-pewter))",
          silver: "hsl(var(--seven-silver))",
          mist: "hsl(var(--seven-mist))",
          cloud: "hsl(var(--seven-cloud))",
          fog: "hsl(var(--seven-fog))",
          paper: "hsl(var(--seven-paper))",
          // Warm surfaces
          cream: "hsl(var(--seven-cream))",
          soft: "hsl(var(--seven-soft))",
          "soft-alt": "hsl(var(--seven-soft-alt))",
          "accent-soft": "hsl(var(--seven-accent-soft))",
          "accent-hover": "hsl(var(--seven-accent-hover))",
        },
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        editorial: "var(--shadow-editorial)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
