import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-serif)'],
        typewriter: ['var(--font-typewriter)'],
        handwriting: ['var(--font-handwriting)'],
      },
    },
  },
  plugins: [],
} satisfies Config