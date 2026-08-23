/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf3', 100: '#d6f5e2', 200: '#b0eaca',
          300: '#7cd9ab', 400: '#45c088', 500: '#22a56d',
          600: '#158459', 700: '#136949', 800: '#13543c',
          900: '#124533', 950: '#07271c'
        }
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      boxShadow: { soft: '0 2px 20px -4px rgba(0,0,0,0.08)' }
    }
  },
  plugins: []
}
