/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['12px', '18px'],
        sm: ['14px', '21px'],
        base: ['14px', '21px'],
        md: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['32px', '40px'],
      },
      colors: {
        border: "hsl(var(--border))",
        "border-muted": "hsl(var(--border-muted))",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
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
        primer: {
          canvas: "#0d1117",
          subtle: "#161b22",
          inset: "#010409",
          border: "#30363d",
          mutedBorder: "#21262d",
          fg: "#f0f6fc",
          muted: "#7d8590",
          subtleFg: "#6e7681",
          green: "#238636",
          greenHover: "#2ea043",
          red: "#f85149",
          redEmphasis: "#da3633",
          blue: "#4493f8",
          orange: "#d29922",
          purple: "#a371f7",
        },
      },
      borderRadius: {
        xs: "6px",
        sm: "4px",
        md: "6px",
        lg: "6px",
        xl: "8px",
        "2xl": "12px",
      },
      boxShadow: {
        subtle: "0 1px 0 rgba(27, 31, 36, 0.04)",
        primer: "0 1px 0 rgba(27, 31, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
        elevated: "0 8px 24px rgba(1, 4, 9, 0.6)",
        card: "0 1px 1px 0 rgba(1, 4, 9, 0.6), 0 1px 3px 0 rgba(1, 4, 9, 0.6)",
        "gh-inset": "rgba(61, 68, 77, 0.7) 0px -1px 0px 0px inset",
        "gh-card": "rgba(1, 4, 9, 0.6) 0px 1px 1px 0px, rgba(1, 4, 9, 0.6) 0px 1px 3px 0px",
        "gh-inset-solid": "rgb(61, 68, 77) 0px -1px 0px 0px inset",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
