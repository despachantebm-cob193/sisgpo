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
      colors: {
        background: '#121212',
        cardBlue: '#39436F',
        cardSlate: '#212b36',
        inputField: '#1b222c',
        cardGreen: '#3B5E5A',
        spamRed: '#8B1C1C',
        premiumOrange: '#F79E1B',
        textMain: '#D3D3D3',
        textSecondary: '#9E9E9E',
        tagBlue: '#007AFF',
        searchbar: '#1E1E1E',
        borderDark: '#1F1F1F',
      },
    },
  },
  plugins: [],
}
