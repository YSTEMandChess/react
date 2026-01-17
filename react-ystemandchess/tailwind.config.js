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
        soft: "#E5F3D2",

        dark: "#1F1F1F",
        gray: "#5C5C5C",
        muted: "#8A8A8A",
        borderLight: "#D6D6D6",
        light: "#F9FAF7",

        red: "#D64545",
        lightRed: "#f4cacaff",
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
      
      boxShadow: {
        'card-yellow': '1.25rem 1.25rem 0.063rem rgb(209, 230, 28)',
        'card-green': '1.25rem 1.25rem 0.063rem rgb(115, 179, 19)',
      },
    },
  },
  plugins: [],
}

