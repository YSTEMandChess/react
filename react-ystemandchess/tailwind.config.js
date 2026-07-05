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
        redLight: "#F5E9E9",
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

      keyframes: {
        'modal-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1)   translateY(0)'    },
        },
        'fade-out': {
          'to': { opacity: '0', transform: 'translateY(-5px)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        'modal-in': 'modal-in 0.15s ease-out',
        'fade-out': 'fade-out 0.4s ease 2.1s forwards',
        'shake': 'shake 0.5s ease',
      },
    },
  },
  plugins: [],
}
