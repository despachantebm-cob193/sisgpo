// Arquivo: tests/obm.spec.ts

import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável e robusta
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible({ timeout: 15000 });
}

test.describe('Fluxo de CRUD para OBMs', () => {
  const timestamp = Date.now();
  const nomeObmTeste = `Batalhão de Teste ${timestamp}`;
  const abreviaturaObmTeste = `BTP-${timestamp}`;
  const cidadeAtualizada = 'Cidade Teste Atualizada';

  test('deve criar, ler, atualizar e deletar uma OBM', async ({ page }) => {
    await login(page);
    
    await page.getByRole('link', { name: 'OBMs' }).click();
    await expect(page.locator('h2:has-text("OBMs")')).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar Nova OBM' }).click();
    await expect(page.locator('h3:has-text("Adicionar Nova OBM")')).toBeVisible();

    // Interação com CreatableSelect
    const creatableSelect = page.locator('#nome');
    await creatableSelect.click();
    await creatableSelect.locator('input').fill(nomeObmTeste);
    await page.getByText(`Criar nova OBM: "${nomeObmTeste}"`).click();

    await page.locator('input[name="abreviatura"]').fill(abreviaturaObmTeste);
    await page.locator('input[name="cidade"]').fill('Cidade Teste');
    await page.locator('input[name="telefone"]').fill('62999998888');
    
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('OBM criada com sucesso!')).toBeVisible();

    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeObmTeste);
    const obmItem = page.locator('tr').filter({ hasText: nomeObmTeste });
    await expect(obmItem).toBeVisible();
    await expect(obmItem).toContainText(abreviaturaObmTeste);

    await obmItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar OBM")')).toBeVisible();
    
    await page.locator('input[name="cidade"]').fill(cidadeAtualizada);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('OBM atualizada com sucesso!')).toBeVisible();
    await expect(obmItem).toContainText(cidadeAtualizada);
    
    await obmItem.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    await expect(page.getByText('OBM excluída com sucesso!')).toBeVisible();
    await expect(obmItem).not.toBeVisible();
  });
});
