/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7f5',
          100: '#b3e6e0',
          200: '#80d4cc',
          300: '#4dc3b7',
          400: '#1ab1a3',
          500: '#009688',
          600: '#00786d',
          700: '#005a52',
          800: '#003c37',
          900: '#001e1b',
        },
        secondary: {
          50: '#e6f3f8',
          100: '#b3d9e9',
          200: '#80bfda',
          300: '#4da5cb',
          400: '#1a8bbc',
          500: '#0071ad',
          600: '#005a8a',
          700: '#004368',
          800: '#002c45',
          900: '#001623',
        },
      },
    },
  },
  plugins: [],
} 