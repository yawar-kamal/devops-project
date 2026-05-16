/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bauhaus: {
          canvas: '#F0F0F0',
          fg: '#121212',
          red: '#D02020',
          blue: '#1040C0',
          yellow: '#F0C020',
          muted: '#E0E0E0',
          'yellow-soft': '#FFF9C4',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        hard: '4px 4px 0 0 #121212',
        'hard-sm': '3px 3px 0 0 #121212',
        'hard-md': '6px 6px 0 0 #121212',
        'hard-lg': '8px 8px 0 0 #121212',
      },
    },
  },
  plugins: [],
};
