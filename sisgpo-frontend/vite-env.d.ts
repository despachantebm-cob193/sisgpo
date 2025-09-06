// Arquivo: frontend/src/vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Adicione outras variáveis de ambiente que você criar aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
