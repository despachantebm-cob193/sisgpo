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
    extend: {},
  },
  plugins: [],
}
