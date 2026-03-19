import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F1E3',
        'category-random': '#EF9C66',
        'category-school': '#FCDCA0',
        'category-personal': '#78ABA8',
        'accent-purple': '#9747FF',
        'accent-brown': '#956E39',
        'title-brown': '#886428',
      },
      fontFamily: {
        serif: ['var(--font-inria-serif)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
