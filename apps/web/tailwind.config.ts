/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#071A3D', 800: '#0D2552', 700: '#16336B' },
        primary: { DEFAULT: '#1F6FEB', 700: '#0B4FC4', 100: '#DCE9FB', 50: '#EEF4FD' },
        accent: { DEFAULT: '#E8512F', 50: '#FDEEEA' },
        success: { DEFAULT: '#0E8F83', 50: '#E6F5F3' },
        warning: { DEFAULT: '#B45309', 50: '#FEF3E2' },
        danger: { DEFAULT: '#D92D20', 50: '#FEECEB' },
        muted: '#5F6F8C',
        line: '#DCE3EF',
        canvas: '#F6F8FC',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        display: ['40px', '48px'],
        h1: ['28px', '36px'],
        h2: ['22px', '30px'],
        h3: ['18px', '26px'],
        body: ['15px', '24px'],
        small: ['13px', '20px'],
        caption: ['12px', '16px'],
      },
      borderRadius: {
        control: '10px',
        card: '16px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(7,26,61,.06), 0 4px 16px rgba(7,26,61,.06)',
        pop: '0 8px 32px rgba(7,26,61,.16)',
      },
      spacing: {
        4: '4px',
        8: '8px',
        12: '12px',
        16: '16px',
        20: '20px',
        24: '24px',
        32: '32px',
        48: '48px',
      }
    },
  },
  plugins: [],
};
