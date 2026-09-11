/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0F',
        card: '#14141E',
        'card-border': '#2A2A3A',
        'text-primary': '#F0F0F5',
        'text-secondary': '#8888A0',
        profit: '#00D4AA',
        loss: '#FF4D6D',
        accent: '#6C63FF',
      },
      fontFamily: {
        sans: ['Vazirmatn', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'glass-hover': '0 12px 40px rgba(108, 99, 255, 0.15)',
      },
    },
  },
  plugins: [],
}