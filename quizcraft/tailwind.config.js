/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B041C', // Deep dark purple background from image_ec16a4.jpg
        card: '#1A1033',       // Slightly lighter purple for glassy cards
        primary: '#D946EF',    // Vibrant pink for primary buttons
        primaryHover: '#C026D3',
        accent: '#8B5CF6',     // Violet accent
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], 
      }
    },
  },
  plugins: [],
}