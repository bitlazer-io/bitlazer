const config = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  content: [
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
      },
      spacing: {},
      fontFamily: {
        sans: [
          '"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        ],
        'maison-neue-trial':
          '"Maison Neue Mono", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        'ocr-x-trial':
          '"OCR-X TTF", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        arial: 'Arial',
      },
      borderRadius: {
        '12xs': '1px',
        '11xs-8': '1.8px',
      },
    },
    fontSize: {
      base: '1rem',
      xl: '1.25rem',
      'lgi-7': '1.231rem',
      smi: '0.813rem',
      inherit: 'inherit',
    },
    screens: {
      md: '992px',
      mq1650: {
        raw: 'screen and (max-width: 1650px)',
      },
      mq1300: {
        raw: 'screen and (max-width: 1300px)',
      },
      mq1250: {
        raw: 'screen and (max-width: 1250px)',
      },
      lg: {
        max: '1200px',
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
