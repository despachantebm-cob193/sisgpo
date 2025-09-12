// Arquivo: tests/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Fluxo de Autenticação', () => {

  test('deve permitir que um usuário com credenciais válidas faça login', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('cbmgo@2025');
    
    // Ação do usuário
    await page.locator('button[type="submit"]').click();

    // Afirmação: Após o login, a URL deve ser a do dashboard protegido.
    await expect(page).toHaveURL('/app/dashboard');
    // E o texto de boas-vindas deve estar visível.
    await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
  });

  test('deve exibir uma mensagem de erro para credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[id="login"]').fill('admin');
    await page.locator('input[id="senha"]').fill('senha_incorreta');
    await page.locator('button[type="submit"]').click();

    // Afirmação: Permanece na página de login e mostra a mensagem de erro.
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Credenciais inválidas.')).toBeVisible();
  });

  test('deve redirecionar para a página de login ao tentar acessar uma rota protegida', async ({ page }) => {
    // Organizar: Tenta acessar uma rota protegida diretamente.
    await page.goto('/app/dashboard');
    
    // Afirmação: Deve ser redirecionado para a página de login.
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[id="login"]')).toBeVisible();
  });
});
