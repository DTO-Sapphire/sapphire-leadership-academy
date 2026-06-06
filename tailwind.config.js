/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sapphire:  '#0F52BA',
        teal:      '#00C2CB',
        lightblue: '#98DFEA',
        orange:    '#FFAF46',
        navy:      '#0A3480',
      },
      fontFamily: {
        sans: ['General Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
