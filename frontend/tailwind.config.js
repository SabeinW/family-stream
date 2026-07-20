/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#040404',
          900: '#0b0b0d',
          800: '#141417',
          700: '#1e1e22',
          600: '#2a2a2f',
        },
        accent: {
          DEFAULT: '#E50914', // signature cinematic red
          dim: '#B00610',
          glow: '#FF1E2D',
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
        glow: '0 0 40px -8px rgba(229,9,20,0.55)',
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
