import { test, expect, Page } from '@playwright/test';

// --- Função Auxiliar de Login ---
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  // Espera que o cabeçalho principal da aplicação esteja visível após o login
  await expect(page.locator('header').getByText('Bem-vindo, admin')).toBeVisible();
}

// --- Suíte de Teste de Sanidade do Sistema ---
test.describe('Teste de Sanidade do Sistema SISGPO', () => {

  // O teste é um único fluxo contínuo para simular uma sessão de usuário
  test('deve permitir a navegação pelas páginas principais sem erros', async ({ page }) => {
    
    // 1. Login
    await test.step('Login no sistema', async () => {
      await login(page);
      await expect(page).toHaveURL('/'); // Confirma que foi redirecionado para o Dashboard
    });

    // 2. Verificar Dashboard
    await test.step('Verificar carregamento do Dashboard', async () => {
      // Espera por um dos cards de estatística para confirmar que a página carregou os dados
      await expect(page.getByText('Militares Ativos')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Viaturas Disponíveis')).toBeVisible();
      await expect(page.getByText('Serviço de Dia')).toBeVisible();
    });

    // 3. Navegar e Verificar OBMs
    await test.step('Navegar para OBMs', async () => {
      await page.locator('a[href="/obms"]').click();
      await expect(page.locator('h2:has-text("OBMs")')).toBeVisible();
      // Verifica se a lista de OBMs (o contêiner de virtualização) contém algum item
      await expect(page.locator('div[data-index]')).not.toHaveCount(0, { timeout: 10000 });
    });

    // 4. Navegar e Verificar Militares
    await test.step('Navegar para Militares', async () => {
      await page.locator('a[href="/militares"]').click();
      await expect(page.locator('h2:has-text("Efetivo (Militares)")')).toBeVisible();
      await expect(page.locator('div[data-index]')).not.toHaveCount(0, { timeout: 10000 });
    });

    // 5. Navegar e Verificar Escala de Médicos
    await test.step('Navegar para Escala de Médicos', async () => {
      // Usa o novo label que definimos
      await page.getByRole('link', { name: 'Escala de Médicos' }).click();
      await expect(page.locator('h2:has-text("Escala de Serviço (Médicos)")')).toBeVisible();
      // Verifica se o cabeçalho da tabela está visível
      await expect(page.getByText('NOME', { exact: true })).toBeVisible();
      await expect(page.getByText('FUNÇÃO', { exact: true })).toBeVisible();
    });

    // 6. Logout
    await test.step('Fazer logout do sistema', async () => {
      await page.getByRole('button', { name: 'Sair' }).click();
      // Após o logout, espera ser redirecionado de volta para a página de login
      await expect(page.locator('h2:has-text("Acesso ao Sistema")')).toBeVisible();
      await expect(page).toHaveURL('/login');
    });
  });
});
