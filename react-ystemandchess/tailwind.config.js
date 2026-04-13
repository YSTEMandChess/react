/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: "#7FCC26",
        secondary: "#BFD99E",
        soft: "#E5F3D2",
        accent: "#EAD94C",

        // Neutrals
        dark: "#1F1F1F",
        gray: "#5C5C5C",
        muted: "#8A8A8A",
        borderLight: "#D6D6D6",
        light: "#F9FAF7",

        // Error colors
        red: "#D64545",
        redLight: "#F4CACAFF",
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
