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
          'morado-950': '#140A22',
          'morado-900': '#231038',
          'morado-800': '#3E1857',
          'morado-700': '#522072',
          'morado-600': '#6B2D8B',
          'morado-500': '#7D379F',
          'morado-400': '#944DB9',
          'morado-300': '#B37CD2',
          'morado-200': '#D4B4E8',
          'morado-100': '#EADBFA',
          'morado-50':  '#F6F0FC',
          dorado:       '#D97706',
          'dorado-600': '#B45309',
          'dorado-100': '#FEF3C7',
          gris:         '#E2D3F0', // Fondo app modo claro: lavanda institucional (#E2D3F0)
          'gris-100':   '#EDE8F4', // Fondo filtros / acentos
          'gris-200':   '#E0D9EB', // Borde visible modo claro
          'gris-300':   '#C9BFD9',
          texto:        '#2A2438', // Texto principal modo claro (WCAG AAA - 14.9:1)
          'texto-suave':'#5E566E', // Texto secundario modo claro (WCAG AA - 6.9:1)
          'texto-muted':'#706880', // Texto atenuado modo claro (WCAG AA normal - 5.28:1)
          // Tokens específicos para superficies oscuras calibradas (azul-violeta profundo)
          'dark-bg':    '#0F0C1B', // Nivel 0: Fondo aplicación oscuro
          'dark-card':  '#1A152B', // Nivel 1: Tarjetas y contenedores
          'dark-header':'#221C38', // Nivel 2: Cabecera tablas / filtros
          'dark-elevated':'#2A2244', // Nivel 3: Modales y flotantes
          'dark-border':'#2E2648', // Borde visible modo oscuro
          'dark-border-strong': '#423766',
          'dark-text':  '#F1EEF7', // Texto principal modo oscuro
          'dark-text-muted': '#A69DB8', // Texto secundario modo oscuro
          'card-dark':  'rgba(26, 21, 43, 0.95)',
          'input-dark': 'rgba(34, 28, 56, 0.90)',
          'border-dark':'rgba(255, 255, 255, 0.12)',
          'exito':      '#10B981',
          'error':      '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      boxShadow: {
        'iecm-sm':   '0 1px 3px 0 rgba(107, 45, 139, 0.08)',
        'iecm-md':   '0 4px 16px 0 rgba(107, 45, 139, 0.12)',
        'iecm-lg':   '0 8px 32px 0 rgba(107, 45, 139, 0.16)',
        'iecm-card': '0 0 0 1px rgba(255,255,255,0.08), 0 32px 64px -16px rgba(0,0,0,0.85), 0 0 60px -15px rgba(107,45,139,0.22)',
        'iecm-glow': '0 0 25px -3px rgba(107, 45, 139, 0.45)',
        'iecm-glow-focus': '0 0 0 3px rgba(155, 89, 200, 0.25), 0 0 20px -2px rgba(107, 45, 139, 0.35)'
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
