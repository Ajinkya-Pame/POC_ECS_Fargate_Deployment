/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#0f172a',
        'brand-teal': '#14b8a6',
        'brand-gold': '#f59e0b',
      }
    },
  },
  plugins: [],
}
