/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Forest greens
        forest: {
          50:  '#f0fdf0',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Earthy tones
        earth: {
          50:  '#fdf8f0',
          100: '#faefd8',
          200: '#f5dcac',
          300: '#edc376',
          400: '#e3a347',
          500: '#d4862a',
          600: '#b86a1f',
          700: '#97501c',
          800: '#7a3f1c',
          900: '#64341a',
        },
        // Moss / olive
        moss: {
          50:  '#f5f7ee',
          100: '#e9eed9',
          200: '#d3ddb5',
          300: '#b5c686',
          400: '#96ad5a',
          500: '#7a9340',
          600: '#607530',
          700: '#4b5c27',
          800: '#3d4b22',
          900: '#34401e',
        },
        // Neutral bark
        bark: {
          50:  '#faf7f4',
          100: '#f2ece4',
          200: '#e3d5c4',
          300: '#cfb79b',
          400: '#b8916e',
          500: '#a3754f',
          600: '#8f5f40',
          700: '#764c35',
          800: '#624030',
          900: '#52372b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
