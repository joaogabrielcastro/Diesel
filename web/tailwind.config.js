/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b00',
        secondary: '#ffa500',
        dark: '#1a1a1a',
        'dark-light': '#2a2a2a',
      },
    },
  },
  plugins: [],
}
