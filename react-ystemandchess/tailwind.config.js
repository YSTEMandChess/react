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
    },
  },
  plugins: [],
}

