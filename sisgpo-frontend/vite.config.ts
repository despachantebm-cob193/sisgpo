// Arquivo: frontend/vite.config.ts (COM A CORREÇÃO)

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // --- CORREÇÃO APLICADA AQUI ---
    // Adiciona a configuração para o novo JSX transform do React.
    // Isso informa ao Vite como lidar com o JSX sem precisar importar o React em cada arquivo.
    react({
      jsxRuntime: 'automatic' 
    } ),
    // --- FIM DA CORREÇÃO ---
    
    tsconfigPaths()
  ],
})
