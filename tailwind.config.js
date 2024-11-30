/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
      },
      colors: {
        main: '#0A0A0A',
        secondary: '#262626',
      }
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};
