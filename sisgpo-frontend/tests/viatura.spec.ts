// Arquivo: tests/viatura.spec.ts

import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável e robusta
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible({ timeout: 15000 });
}

test.describe('Fluxo de CRUD para Viaturas', () => {
  const timestamp = Date.now();
  const prefixoViaturaTeste = `VTR-TESTE-${timestamp}`;
  const prefixoViaturaAtualizado = `VTR-UPDATED-${timestamp}`;

  test('deve criar, ler, atualizar e deletar uma Viatura', async ({ page }) => {
    await login(page);
    
    await page.getByRole('link', { name: 'Viaturas' }).click();
    await expect(page.locator('h2:has-text("Viaturas")')).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar Viatura' }).click();
    
    await page.locator('input[name="prefixo"]').fill(prefixoViaturaTeste);
    await page.locator('input[name="obm"]').fill('1º BBM (Teste Playwright)');
    await page.locator('input[name="cidade"]').fill('Goiânia (Teste Playwright)');
    
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Viatura criada com sucesso!')).toBeVisible();

    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaTeste);
    const viaturaItem = page.locator('tr').filter({ hasText: prefixoViaturaTeste });
    await expect(viaturaItem).toBeVisible();

    await viaturaItem.getByRole('button', { name: 'Editar' }).click();
    await page.locator('input[name="prefixo"]').fill(prefixoViaturaAtualizado);
    await page.locator('input[name="ativa"]').uncheck();
    
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Viatura atualizada com sucesso!')).toBeVisible();

    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaAtualizado);
    const viaturaItemAtualizado = page.locator('tr').filter({ hasText: prefixoViaturaAtualizado });
    await expect(viaturaItemAtualizado).toBeVisible();
    await expect(viaturaItemAtualizado).toContainText('Inativa');

    await viaturaItemAtualizado.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    await expect(page.getByText('Viatura excluída com sucesso!')).toBeVisible();
    await expect(viaturaItemAtualizado).not.toBeVisible();
  });
});
