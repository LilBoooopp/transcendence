/**@type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
  	content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chess board colors
        'board-light': '#f0d9b5',
        'board-dark': '#b58863',

		background: {
			light: '#eff6e0', // Light mode bg
			dark: '#01161e',  // Dark mode bg
		},
		text: {
			default: '#eff6e0', // Light text (for dark backgrounds/buttons)
			dark: '#01161e',    // Dark text (for light backgrounds)
		},
		primary: {
			DEFAULT: '#124559',
			hover: '#1a5f7a', 
		},
		secondary: {
			DEFAULT: '#435646',
			hover: '#566e5a',
		},
		accent: {
			DEFAULT: '#AEC3B0',
			hover: '#c4d6c6',
		}
		},
		fontFamily: {
			heading: ['"Young Serif"', 'serif'],
			body: ['"Geist"', 'sans-serif'],
		}
    },
  },
  plugins: [],
}
