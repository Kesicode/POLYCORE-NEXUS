/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // PolyCore Nexus design system
        surface: '#0F1117',
        panel: '#1A1D26',
        'panel-hover': '#1F2335',
        border: '#2D3149',
        'border-light': '#3D4568',

        primary: {
          DEFAULT: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          500: '#8B5CF6',
          600: '#7C3AED',
        },

        text: {
          primary: '#F1F5F9',
          secondary: '#94A3B8',
          muted: '#475569',
        },

        status: {
          online: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
          offline: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
