/**
 * @format
 * @type {import('tailwindcss').Config}
 */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Swiss Style / July Palette - #ff5722 as primary accent
        primary: {
          DEFAULT: "#ff5722", // Smashing Pumpkins
          dark: "#e64a19", // Crunchy Carrot
          light: "#ff8a65", // Salmon Nigiri
          fiery: "#f4511e", // Fiery Glow
          persimmon: "#ff7043", // Precious Persimmon
        },
        // Semantic colors - desaturated/monochromatic for Swiss context
        success: {
          DEFAULT: "#356342",
          dark: "#2a4f35",
          light: "#5b8766",
        },
        warning: {
          DEFAULT: "#9a5a21",
          dark: "#754318",
          light: "#b67335",
        },
        danger: {
          DEFAULT: "#a53a2b",
          dark: "#7d2b21",
          light: "#c34b38",
        },
        // Swiss monochromatic background system
        background: {
          light: "#f4f4f4",
          dark: "#f4f4f4", // Swiss: always light (no dark mode inversion)
        },
        card: {
          light: "#fafafa",
          dark: "#fafafa",
        },
        border: {
          light: "#1e1e1e",
          dark: "#1e1e1e",
        },
        text: {
          light: "#1e1e1e",
          dark: "#1e1e1e",
          mutedLight: "#555555",
          mutedDark: "#555555",
        },
      },
      fontFamily: {
        // Swiss editorial grotesque - Space Grotesk first, Inter fallback
        sans: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Swiss Style: NO box shadows - all elevation via borders
      boxShadow: {
        none: "none",
        "soft-sm": "none",
        soft: "none",
        "soft-md": "none",
      },
      // Swiss Style: ZERO border-radius - hard 90° corners only
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "0",
      },
      animation: {
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
