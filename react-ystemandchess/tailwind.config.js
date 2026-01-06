/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#7FCC26",
        secondary: "#EAD94C",

        background: {
          DEFAULT: "#F9FAF7",
          soft: "#E5F3D2",
        },

        text: {
          primary: "#1F1F1F",
          secondary: "#5C5C5C",
          muted: "#8A8A8A",
        },

        border: {
          light: "#E0E0E0",
          focus: "#7FCC26",
        },

        error: {
          text: "#D64545",
          background: "#f4cacaff",
        },
      },

      fontFamily: {
        sans: [
          "Lato",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },

      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.375rem",
        xxl: "1.75rem",
      },

      fontWeight: {
        regular: 400,
        medium: 500,
        bold: 700,
      },

      lineHeight: {
        tight: "1.2",
        normal: "1.5",
        relaxed: "1.7",
      },

      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },

      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },

      boxShadow: {
        sm: "0 2px 6px rgba(0, 0, 0, 0.08)",
        md: "0 4px 12px rgba(0, 0, 0, 0.12)",
      },

      animation: {
        shimmer: "shimmer 2s linear infinite",
      },

      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
}

