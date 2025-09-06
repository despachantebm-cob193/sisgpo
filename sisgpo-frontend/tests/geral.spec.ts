import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('header').getByText('Bem-vindo, admin')).toBeVisible({ timeout: 15000 });
}

test.describe('Teste de Sanidade do Sistema SISGPO', () => {
  test('deve permitir a navegação pelas páginas principais sem erros', async ({ page }) => {
    
    await test.step('Login no sistema', async () => {
      await login(page);
      await expect(page).toHaveURL('/');
    });

    await test.step('Verificar carregamento do Dashboard', async () => {
      await expect(page.getByRole('heading', { name: 'Viaturas Disponíveis', exact: true })).toBeVisible({ timeout: 15000 });
    });

    await test.step('Navegar para OBMs', async () => {
      await page.getByRole('link', { name: 'OBMs' }).click();
      await expect(page.locator('h2:has-text("OBMs")')).toBeVisible();
      // Verifica se o cabeçalho da tabela de OBMs está visível
      await expect(page.getByText('Nome', { exact: true })).toBeVisible();
    });

    await test.step('Navegar para Militares', async () => {
      await page.getByRole('link', { name: 'Militares' }).click();
      await expect(page.locator('h2:has-text("Efetivo (Militares)")')).toBeVisible();
      // Verifica se o cabeçalho da tabela de Militares está visível
      await expect(page.getByText('Nome Completo', { exact: true })).toBeVisible();
    });

    await test.step('Navegar para Escala de Médicos', async () => {
      await page.getByRole('link', { name: 'Escala de Médicos' }).click();
      await expect(page.locator('h2:has-text("Escala de Serviço (Médicos)")')).toBeVisible();
      // A verificação agora é mais simples e direta, pois os cabeçalhos sempre existirão.
      await expect(page.getByText('Nome', { exact: true })).toBeVisible();
    });

    await test.step('Fazer logout do sistema', async () => {
      await page.getByRole('button', { name: 'Sair' }).click();
      await expect(page.locator('h2:has-text("Acesso ao Sistema")')).toBeVisible();
    });
  });
});
