/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#080E1E',
          surface: '#111C35',
          card: '#162344',
          cardHover: '#1F315E',
          border: '#243A6D',
          borderHover: '#37579E',
          orange: '#FF7A00',
          orangeHover: '#FF9100',
          orangeLight: '#FFF0E5',
          amber: '#F59E0B',
          green: '#10B981',
          red: '#EF4444',
          gold: '#FFD700',
        },
        light: {
          bg: '#F3F5FA',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          border: '#E2E8F0',
          borderHover: '#CBD5E1',
          text: '#0F172A',
          textMuted: '#64748B',
        }
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 122, 0, 0.35)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.35)',
        'steam-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
