import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( ), tsconfigPaths()],
  // A configuração explícita de CSS/PostCSS não é necessária aqui
  // se os arquivos de configuração (postcss.config.js) existirem na raiz.
  // Vamos remover essa seção para simplificar e evitar conflitos.
})
