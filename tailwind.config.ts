import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F1F',
        bgCard: '#1A1A2E',
        border: '#2A2A3E',
        primary: '#A78BFA',
        primaryLight: '#C4B5FD',
      },
    },
  },
  plugins: [],
};

export default config;
