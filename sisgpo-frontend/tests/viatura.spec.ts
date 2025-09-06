import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
}

test.describe('Fluxo de CRUD para Viaturas', () => {
  
  const timestamp = Date.now();
  const prefixoViaturaTeste = `VTR-TESTE-${timestamp}`;
  const prefixoViaturaAtualizado = `VTR-UPDATED-${timestamp}`;

  test('deve criar, ler, atualizar e deletar uma Viatura', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/viaturas"]').click();
    await expect(page.locator('h2:has-text("Viaturas")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Viatura")').click();
    
    await page.locator('input[name="prefixo"]').fill(prefixoViaturaTeste);
    await page.locator('input[name="obm"]').fill('1º BBM (Teste Playwright)');
    await page.locator('input[name="cidade"]').fill('Goiânia (Teste Playwright)');
    
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Viatura criada com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) - CORREÇÃO APLICADA ---
    // 1. Filtra pelo prefixo único da viatura criada.
    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaTeste);
    
    // 2. Localiza o item na tabela.
    const viaturaItem = page.locator('tr').filter({ hasText: prefixoViaturaTeste });

    // 3. Verifica se o item está visível.
    await expect(viaturaItem).toBeVisible({ timeout: 10000 });

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await viaturaItem.getByRole('button', { name: 'Editar' }).click();
    
    await page.locator('input[name="prefixo"]').fill(prefixoViaturaAtualizado);
    await page.locator('input[name="ativa"]').uncheck(); // Desativa a viatura
    
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Viatura atualizada com sucesso!')).toBeVisible();

    // Filtra novamente pelo prefixo atualizado para garantir que a busca funcione
    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaAtualizado);
    const viaturaItemAtualizado = page.locator('tr').filter({ hasText: prefixoViaturaAtualizado });
    await expect(viaturaItemAtualizado).toBeVisible();
    await expect(viaturaItemAtualizado).toContainText('Inativa');

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await viaturaItemAtualizado.getByRole('button', { name: 'Excluir' }).click();
    
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Viatura excluída com sucesso!')).toBeVisible();

    await expect(viaturaItemAtualizado).not.toBeVisible();
  });
});
