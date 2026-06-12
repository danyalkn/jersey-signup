import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Praxis FC brand — deep navy field, electric blue accents (see club
        // graphics: near-black navy bg, royal-blue bands, white display type).
        praxis: {
          black: '#060B16', // page gradient top/bottom
          navy: '#0B1528',  // page base
          deep: '#0A1733',  // page gradient mid stop (blue-tinted)
          panel: '#0E1A30', // cards / modals
          line: '#1C2B4A',  // hairline borders on dark
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-anton)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
