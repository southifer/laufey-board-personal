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
  devServer: {
    client: {
      overlay: {
        runtimeErrors: (error) => {
          if(error?.message === "ResizeObserver loop completed with undelivered notifications.")
          {
             console.error(error)
             return false;
          }
          return true;
        },
      },
    },
  },
};