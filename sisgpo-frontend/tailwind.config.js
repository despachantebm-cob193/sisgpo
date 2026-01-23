// Arquivo: frontend/tailwind.config.js (Código Completo e CORRIGIDO)

/** @type {import('tailwindcss').Config} */
export default {
  // A propriedade 'content' é a chave para a responsividade funcionar.
  // Ela deve incluir todos os caminhos para os arquivos que contêm classes do Tailwind.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Garante que todos os arquivos dentro de 'src' sejam escaneados
  ],
  theme: {
    extend: {
      keyframes: {
        aurora: {
          '0%': { transform: 'translate3d(-10%, -8%, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(6%, 10%, 0) rotate(35deg)' },
          '100%': { transform: 'translate3d(12%, -6%, 0) rotate(70deg)' },
        },
        'grid-move': {
          '0%': { backgroundPosition: '0px 0px, 0px 0px' },
          '100%': { backgroundPosition: '40px 40px, 40px 40px' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
      },
      animation: {
        aurora: 'aurora 20s ease-in-out infinite alternate',
        'grid-move': 'grid-move 18s linear infinite',
        shine: 'shine 1.8s ease-in-out infinite',
      },
      boxShadow: {
        'neon-cyan': '0 0 25px rgba(34,211,238,.28), 0 0 60px rgba(34,211,238,.18)',
      },
      dropShadow: {
        'neon-cyan': '0 0 8px rgba(34,211,238,.8)',
      },
      colors: {
        background: '#121212',
        cardBlue: '#39436F',
        cardSlate: '#212b36',
        inputField: '#1b222c',
        cardGreen: '#3B5E5A',
        spamRed: '#8B1C1C',
        premiumOrange: '#F79E1B',
        codecPurple: '#7C3AED',
        textMain: '#D3D3D3',
        textSecondary: '#9E9E9E',
        tagBlue: '#007AFF',
        brightBlue: '#00BFFF',
        brightYellow: '#FFFF00', // Yellow
        searchbar: '#1E1E1E',
        borderDark: '#1F1F1F',
        neon: '#22d3ee',
        magenta: '#e879f9',
        limepulse: '#84cc16',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
