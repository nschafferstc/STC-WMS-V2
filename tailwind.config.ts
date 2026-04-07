import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // STC Brand — Navy (#1a2744)
        navy: {
          50:  '#eef1f7',
          100: '#d5dcec',
          200: '#adb9d9',
          300: '#8596c6',
          400: '#5d73b3',
          500: '#3a5099',  // mid-range saturated
          600: '#2e4080',
          700: '#243368',
          800: '#1e2b56',
          900: '#1a2744',  // brand primary
          950: '#111b31',
        },
        // STC Brand — Orange (#f4811f)
        orange: {
          50:  '#fff6ed',
          100: '#ffead4',
          200: '#ffd3a8',
          300: '#ffb672',
          400: '#fd9039',
          500: '#f4811f',  // brand primary
          600: '#e06710',
          700: '#ba4f0e',
          800: '#943f13',
          900: '#783613',
          950: '#411a07',
        },
        // shadcn/ui semantic tokens (mapped to CSS variables)
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        // shadcn/ui accordion animations
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        // Subtle fade-in for page transitions
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Pulse for loading skeletons
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.3s ease-out',
        'shimmer':        'shimmer 1.5s infinite linear',
      },
      boxShadow: {
        // STC brand-colored shadow for focus/selected states
        'navy':  '0 0 0 3px rgba(26, 39, 68, 0.25)',
        'orange': '0 0 0 3px rgba(244, 129, 31, 0.35)',
      },
    },
  },
  plugins: [animate],
}

export default config
