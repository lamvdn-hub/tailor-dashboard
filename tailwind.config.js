/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lora', 'serif'],
      },
      screens: {
        'xs': '475px',
      },
      colors: {
        gray: {
          750: '#2d3748',
        },
      },
    },
  },
  plugins: [],
};
