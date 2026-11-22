import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--surface-white) / <alpha-value>)',
        pure: '#FFFFFF',
        primary: {
          DEFAULT: '#4F8CFF',
          50: '#EEF4FF',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          500: '#4F8CFF',
          600: '#3B74E8',
          700: '#2F5FC0',
        },
        violet: {
          DEFAULT: '#6C5CE7',
          500: '#6C5CE7',
          600: '#5B4BD1',
        },
        mint: {
          DEFAULT: '#22C55E',
          500: '#22C55E',
        },
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          50: 'rgb(var(--ink-50) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 45px -24px rgba(15, 23, 42, 0.65)',
        glow: '0 0 0 1px rgba(79, 140, 255, 0.22), 0 18px 40px -24px rgba(79, 140, 255, 0.55)',
      },
      backgroundImage: {
        'panel-glow': 'radial-gradient(circle at 12% 0%, rgba(79,140,255,0.18), transparent 38%)',
        'violet-glow': 'radial-gradient(circle at 88% 0%, rgba(108,92,231,0.16), transparent 40%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config
