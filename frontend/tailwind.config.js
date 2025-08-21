const config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000',
        gray: {
          100: '#7a7a7a',
          200: '#767a7a',
          300: '#122810',
          400: '#0f210d',
        },
        dimgray: {
          100: '#6d6d6d',
          200: '#5e6161',
        },
        forestgreen: '#3d8938',
        darkslategray: {
          100: '#425440',
          200: '#393a3a',
          300: '#333',
        },
        lightgreen: {
          100: '#66d560',
          200: '#66d460',
          300: 'rgba(102, 213, 96, 0.3)',
        },
        white: '#fff',
        darkolivegreen: {
          100: '#4d7a47',
          200: '#255322',
          300: '#174d14',
        },
        fuchsia: '#ff00ff',
        darkgreen: 'rgba(30, 101, 27, 0.3)',
        'neutral-800': '#393a3a',
      },
      spacing: {},
      fontFamily: {
        sans: [
          '"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        ],
        'maison-neue':
          '"Maison Neue Mono", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        ocrx: '"OCRX", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        arial: 'Arial',
      },
      borderRadius: {
        '12xs': '1px',
        '11xs-8': '1.8px',
      },
      animation: {
        'loading-dots': 'loading 2s infinite',
        'loading-pulse': 'loadingPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        loading: {
          '0%': { opacity: '0.2' },
          '20%': { opacity: '1' },
          '100%': { opacity: '0.2' },
        },
        loadingPulse: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.8' },
        },
      },
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: '1rem',
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: '1.25rem',
      '2xl': '1.45rem',
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': '4.25rem',
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': '3.75rem',
      'lgi-7': '1.231rem',
      smi: '0.813rem',
      inherit: 'inherit',
    },
    screens: {
      sm: '640px',
      md: '768px', 
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      mq1650: {
        raw: 'screen and (max-width: 1650px)',
      },
      mq1300: {
        raw: 'screen and (max-width: 1300px)',
      },
      mq1250: {
        raw: 'screen and (max-width: 1250px)',
      },
      mq1100: {
        raw: 'screen and (max-width: 1100px)',
      },
      mq1050: {
        raw: 'screen and (max-width: 1050px)',
      },
      mq900: {
        raw: 'screen and (max-width: 900px)',
      },
      mq750: {
        raw: 'screen and (max-width: 750px)',
      },
      mq450: {
        raw: 'screen and (max-width: 450px)',
      },
    },
  },
  corePlugins: {
    preflight: false,
    container: false,
  },
  plugins: [],
}
export default config
