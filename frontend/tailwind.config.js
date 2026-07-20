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
        display: ['"Bebas Neue"', 'Archivo Black', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-fade':
          'linear-gradient(180deg, rgba(4,4,4,0) 0%, rgba(4,4,4,0.4) 55%, rgba(4,4,4,1) 100%)',
        'hero-side':
          'linear-gradient(90deg, rgba(4,4,4,0.95) 0%, rgba(4,4,4,0.2) 50%, rgba(4,4,4,0.7) 100%)',
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
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
