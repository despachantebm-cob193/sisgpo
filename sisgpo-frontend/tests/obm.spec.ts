// Arquivo: frontend/tests/obm.spec.ts (Corrigido para usar CreatableSelect)

import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
}

test.describe('Fluxo de CRUD para OBMs', () => {
  
  const timestamp = Date.now();
  const nomeObmTeste = `Batalhão de Teste ${timestamp}`;
  const abreviaturaObmTeste = `BTP-${timestamp}`;
  const nomeObmAtualizado = `Batalhão Atualizado ${timestamp}`;

  test('deve criar, ler, atualizar e deletar uma OBM', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/obms"]').click();
    await expect(page.locator('h2:has-text("OBMs")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Nova OBM")').click();
    await expect(page.locator('h3:has-text("Adicionar Nova OBM")')).toBeVisible();

    // --- CORREÇÃO APLICADA AQUI ---
    // Interage com o componente CreatableSelect
    const creatableSelect = page.locator('#nome'); // Localiza o componente pelo ID
    await creatableSelect.click(); // Clica para abrir as opções/permitir digitação
    await creatableSelect.locator('input').fill(nomeObmTeste); // Preenche o input interno
    await page.getByText(`Criar nova OBM: "${nomeObmTeste}"`).click(); // Clica na opção de criar
    // --- FIM DA CORREÇÃO ---

    await page.locator('input[name="abreviatura"]').fill(abreviaturaObmTeste);
    await page.locator('input[name="cidade"]').fill('Cidade Teste');
    await page.locator('input[name="telefone"]').fill('62999999999');
    
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('OBM criada com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeObmTeste);
    const obmItem = page.locator('div[data-index]').filter({ hasText: nomeObmTeste });
    await expect(obmItem).toBeVisible();
    await expect(obmItem).toContainText(abreviaturaObmTeste);

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await obmItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar OBM")')).toBeVisible();
    
    // Na edição, o campo nome é um CreatableSelect, mas já vem preenchido.
    // Vamos apenas atualizar os outros campos para simplificar.
    await page.locator('input[name="cidade"]').fill('Cidade Atualizada');
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('OBM atualizada com sucesso!')).toBeVisible();

    // Verifica se o item foi realmente atualizado na lista
    const obmItemAtualizado = page.locator('div[data-index]').filter({ hasText: nomeObmTeste });
    await expect(obmItemAtualizado).toBeVisible();
    await expect(obmItemAtualizado).toContainText('Cidade Atualizada');
    
    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await obmItemAtualizado.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('h3:has-text("Confirmar Exclusão")')).toBeVisible();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('OBM excluída com sucesso!')).toBeVisible();
    
    await expect(obmItemAtualizado).not.toBeVisible();
  });
});
