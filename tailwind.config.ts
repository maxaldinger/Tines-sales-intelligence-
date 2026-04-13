import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        tines: '#7C5CFC',
        'tines-dark': '#1A1E2E',
      },
    },
  },
  plugins: [],
}
export default config
