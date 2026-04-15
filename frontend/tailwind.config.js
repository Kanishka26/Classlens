/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8f8fa',
          100: '#f0f0f5',
          200: '#e1e1eb',
          300: '#c7c7d3',
          400: '#9a9aad',
          500: '#6d6d7f',
          600: '#4a4a5e',
          700: '#33334a',
          800: '#1a1a2e',
          900: '#0a0e27',
          950: '#050810',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sohne', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '24px' }],
        lg: ['17px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '1' }],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0em',
        wide: '0.01em',
        wider: '0.02em',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        md: '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
        lg: '0 8px 24px 0 rgba(0, 0, 0, 0.2)',
        xl: '0 12px 32px 0 rgba(0, 0, 0, 0.25)',
        glow: '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropFilter: {
        none: 'none',
        blur: 'blur(10px)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'slideInRight': 'slideInRight 0.5s ease-out',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.6)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
