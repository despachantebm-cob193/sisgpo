// Arquivo: frontend/tests/auth.spec.ts (COM A CORREÇÃO DE TIMEOUT)

import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação', () => {

  test('deve permitir que um usuário com credenciais válidas faça login', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('cbmgo@2025');
    
    // --- CORREÇÃO APLICADA AQUI (EM AMBOS OS TESTES) ---
    // Adicionamos noWaitAfter para evitar que o teste fique preso esperando a navegação.
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('deve exibir uma mensagem de erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('senha_incorreta');

    // --- CORREÇÃO APLICADA AQUI (EM AMBOS OS TESTES) ---
    await page.locator('button[type="submit"]').click({ noWaitAfter: true });

    // As asserções seguintes já esperam o resultado, então o fluxo fica correto.
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Credenciais inválidas.')).toBeVisible();
  });

  test('deve redirecionar para a página de login ao tentar acessar uma rota protegida', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[id="login"]')).toBeVisible();
  });
});
