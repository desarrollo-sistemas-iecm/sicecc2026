/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,vue}'
  ],
  theme: {
    extend: {
      colors: {
        iecm: {
          morado:       '#6B2D8B',
          'morado-950': '#1F0B2F',
          'morado-800': '#4A1F6B',
          'morado-700': '#5C2678',
          'morado-600': '#6B2D8B',
          'morado-500': '#7B3FA0',
          'morado-400': '#9B59C8',
          'morado-300': '#B57ED6',
          'morado-100': '#EFE0F7',
          'morado-50':  '#F9F3FD',
          dorado:       '#F5A623',
          'dorado-600': '#D4881A',
          'dorado-100': '#FEF3DC',
          gris:         '#F4F4F6',
          'gris-200':   '#E0E0E0',
          texto:        '#4A4A4A',
          'texto-suave':'#6E6E6E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'iecm-sm': '0 1px 3px 0 rgba(107, 45, 139, 0.08)',
        'iecm-md': '0 4px 16px 0 rgba(107, 45, 139, 0.12)',
        'iecm-lg': '0 8px 32px 0 rgba(107, 45, 139, 0.16)',
      },
      animation: {
        'pulso-boton': 'pulso 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulso: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '.85', transform: 'scale(1.02)' },
        }
      }
    }
  },
  plugins: []
}
