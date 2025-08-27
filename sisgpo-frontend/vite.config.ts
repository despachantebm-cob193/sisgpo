import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths' // 1. Importe o plugin

// https://vitejs.dev/config/
export default defineConfig({
  // 2. Adicione o plugin à lista de plugins
  plugins: [react( ), tsconfigPaths()], 
  
  // 3. A seção 'resolve.alias' manual pode ser removida
})
