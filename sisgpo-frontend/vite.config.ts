// Arquivo: frontend/vite.config.ts (Completo e Corrigido)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react( ),
    tsconfigPaths() // Adiciona o plugin para resolver os caminhos
  ],
})
