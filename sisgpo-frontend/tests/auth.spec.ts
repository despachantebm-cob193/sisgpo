// Arquivo: frontend/tests/auth.spec.ts (Corrigido)

import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação', () => {

  test('deve permitir que um usuário com credenciais válidas faça login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('cbmgo@2025');
    
    // --- CORREÇÃO APLICADA AQUI ---
    // Evita que o Playwright espere por uma navegação que não ocorre,
    // tornando o teste mais rápido e estável em SPAs.
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    // A asserção seguinte já aguarda o resultado da ação.
    await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('deve exibir uma mensagem de erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('senha_incorreta');

    // --- CORREÇÃO APLICADA AQUI ---
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Credenciais inválidas.')).toBeVisible();
  });

  test('deve redirecionar para a página de login ao tentar acessar uma rota protegida', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[id="login"]')).toBeVisible();
  });
});
