import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      keyframes: {
        starGlow: {
          '0%, 100%': {
            boxShadow:
              '0 0 5px rgba(255, 197, 0, 0.8), 0 0 15px rgba(255, 197, 0, 0.4)',
          },
          '50%': {
            boxShadow:
              '0 0 10px rgba(255, 197, 0, 1), 0 0 20px rgba(255, 197, 0, 0.7)',
          },
        },
      },
      animation: {
        star: 'starGlow 1.5s infinite ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
