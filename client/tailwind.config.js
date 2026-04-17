/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0f',
          panel: '#151520',
          accent: '#00f0ff',
          alert: '#ff0055',
          predictive: '#b000ff'
        }
      }
    },
  },
  plugins: [],
}
