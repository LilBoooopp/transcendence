// frontend/tailwind.config.js
const themeColors = require('./src/themeColors');

/**@type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: themeColors, // <-- Inject your centralized colors here
      fontFamily: {
        heading: ['"Young Serif"', 'serif'],
        body: ['"Geist"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}