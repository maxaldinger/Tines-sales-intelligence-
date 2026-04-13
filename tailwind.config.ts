import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        tines: {
          DEFAULT: '#7C5CFC',
          light: '#A78BFA',
          muted: '#9B8FBF',
          dim: '#6B5F8A',
          hover: '#6A4AE0',
        },
        surface: {
          DEFAULT: '#0F0B1A',
          raised: '#161224',
          overlay: '#1D1730',
          border: '#2A2540',
        },
      },
    },
  },
  plugins: [],
}
export default config
