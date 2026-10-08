/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#030308',
          900: '#0a0a12',
          800: '#12121c',
          700: '#1c1c2b',
          600: '#282838',
        },
        accent: {
          // Sourced from CSS variables (see index.css) so the active color theme
          // can be swapped at runtime without rebuilding the Tailwind stylesheet.
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          dim: 'rgb(var(--accent-dim-rgb) / <alpha-value>)',
          glow: 'rgb(var(--accent-glow-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        // Inter Tight for titles/wordmark: a tighter-set, heavier cut of the UI
        // face, closer to the bespoke sans the big streamers use than a
        // condensed poster font.
        display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Both fades end on base-950 so the billboard dissolves into the page
        // instead of stopping at a visible edge.
        'hero-fade':
          'linear-gradient(180deg, rgba(3,3,8,0) 0%, rgba(3,3,8,0.15) 45%, rgba(3,3,8,0.75) 78%, rgba(3,3,8,1) 100%)',
        'hero-side':
          'linear-gradient(90deg, rgba(3,3,8,0.92) 0%, rgba(3,3,8,0.55) 32%, rgba(3,3,8,0) 62%)',
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(0,0,0,0.7)',
        glow: '0 0 40px -8px rgb(var(--accent-rgb) / 0.55)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        // Slow "Ken Burns" push-in on billboard artwork.
        kenburns: {
          '0%': { transform: 'scale(1.0)' },
          '100%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        kenburns: 'kenburns 12s ease-out forwards',
      },
      transitionTimingFunction: {
        // The app's single "premium" curve: fast start, long soft landing.
        cinema: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
