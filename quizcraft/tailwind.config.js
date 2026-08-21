/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // QuizCraft Workshop Palette
        parchment: '#F5F0E8',
        'parchment-dim': '#E8E0D0',
        ink: '#1C1A17',
        'ink-soft': '#3D3A36',
        verdigris: '#4A7C7C',
        'verdigris-light': '#6B9B9B',
        'verdigris-dim': '#3A6666',
        saffron: '#E8A838',
        'saffron-light': '#F0C058',
        'saffron-dim': '#C88C2E',
        'charcoal-wash': '#2D2A26',
        'charcoal-wash-light': '#3D3933',
        vellum: '#FAF6F0',
        'vellum-dim': '#F0EBE0',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Fluid type scale using clamp()
        'display-xl': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['clamp(2rem, 4vw, 3.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['clamp(1.375rem, 2.5vw, 1.75rem)', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-base': ['1rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.5', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase' }],
        'data': ['0.875rem', { lineHeight: '1.5', fontWeight: '500', fontFamily: 'JetBrains Mono, monospace' }],
      },
      boxShadow: {
        'paper': '0 4px 24px -4px rgba(28,26,23,0.15), 0 1px 3px rgba(28,26,23,0.08)',
        'paper-hover': '0 8px 32px -4px rgba(28,26,23,0.2), 0 2px 6px rgba(28,26,23,0.1)',
        'paper-pressed': '0 2px 8px -2px rgba(28,26,23,0.15)',
        'forge': '0 0 40px -8px rgba(232,168,56,0.3), 0 4px 24px -4px rgba(28,26,23,0.15)',
        'ember': '0 0 20px -4px rgba(232,168,56,0.4)',
      },
      borderRadius: {
        'tool': '4px',
        'card': '8px',
        'surface': '12px',
        'modal': '16px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'craft': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      animation: {
        'forge-heat': 'forge-heat 1.2s ease-in-out infinite',
        'ember-rise': 'ember-rise 1.5s ease-out forwards',
        'ember-drift': 'ember-drift 2s ease-in-out infinite',
        'status-pulse': 'status-pulse 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'flip-in': 'flip-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'forge-heat': {
          '0%, 100%': { opacity: '0.4', transform: 'scaleX(0.8)' },
          '50%': { opacity: '1', transform: 'scaleX(1)' },
        },
        'ember-rise': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(0.5)' },
        },
        'ember-drift': {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(8px)' },
          '100%': { transform: 'translateX(0)' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'flip-in': {
          from: { opacity: '0', transform: 'rotateY(90deg)' },
          to: { opacity: '1', transform: 'rotateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'verdigris-texture': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        'parchment-grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}