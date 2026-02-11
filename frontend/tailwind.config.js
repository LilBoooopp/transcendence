/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chess board colors
        'board-light': '#f0d9b5',
        'board-dark': '#b58863',
        // Custom theme colors (can be customized)
        'primary': '#3b82f6',
        'secondary': '#8b5cf6',
        'accent': '#10b981',
      },
    },
  },
  plugins: [],
}
