/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#173F35',
          deep: '#102E28',
          primary: '#244F42',
        },
        sage: '#A8BDA8',
        mint: '#E8F0E9',
        ivory: '#F8F6EF',
        gold: '#C6A56B',
        charcoal: '#26352F',
        muted: '#78847C',
        border: '#E4E9E2',
        warning: '#D99A50',
        error: '#C85D55',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(23, 63, 53, 0.06)',
        card: '0 10px 30px -5px rgba(23, 63, 53, 0.08)',
      },
    },
  },
  plugins: [],
};
