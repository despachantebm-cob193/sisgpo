// Arquivo: frontend/playwright.config.ts (Versão Final Corrigida)

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  // Aumenta o timeout global para cada teste, dando mais margem em ambientes lentos.
  timeout: 60 * 1000, // 60 segundos

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Garante que o servidor de desenvolvimento do frontend esteja 100% pronto
  // antes de qualquer teste ser executado.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Aumenta o tempo de espera para o servidor iniciar, crucial para CIs ou máquinas mais lentas.
    timeout: 120 * 1000, 
    // A propriedade 'killSignal' foi removida pois não é uma opção válida.
  },
} );
