import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        leiden: {
          navy: '#001158',
          'navy-light': '#002580',
          'navy-mid': '#0a2060',
          red: '#be1908',
          'red-light': '#d42010',
          cream: '#f5f0eb',
          muted: '#8b9db8',
        },
        // keep gray-950 for any leftover references
        gray: {
          950: '#001158',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
