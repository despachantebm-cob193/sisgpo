// Arquivo: frontend/tests/viatura.spec.ts (VERSÃO FINAL COM getByText)

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// --- Função Auxiliar para Login ---
async function login(page: Page ) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(BASE_URL + '/');
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
    
    // <-- CORREÇÃO: Espera pelo toast com o texto exato.
    await expect(page.getByText('Viatura criada com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaTeste);
    const viaturaItem = page.locator('div[data-index]').filter({ hasText: prefixoViaturaTeste });
    await expect(viaturaItem).toBeVisible();

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await viaturaItem.getByRole('button', { name: 'Editar' }).click();
    
    await page.locator('input[name="prefixo"]').fill(prefixoViaturaAtualizado);
    await page.locator('input[name="ativa"]').uncheck();
    
    await page.locator('button:has-text("Salvar")').click();
    
    // <-- CORREÇÃO: Espera pelo toast com o texto exato.
    await expect(page.getByText('Viatura atualizada com sucesso!')).toBeVisible();

    // --- VERIFICAÇÃO DA ATUALIZAÇÃO ---
    await page.locator('input[placeholder="Filtrar por prefixo..."]').fill(prefixoViaturaAtualizado);
    const viaturaItemAtualizado = page.locator('div[data-index]').filter({ hasText: prefixoViaturaAtualizado });
    await expect(viaturaItemAtualizado).toBeVisible();
    await expect(viaturaItemAtualizado).toContainText('Inativa');

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await viaturaItemAtualizado.getByRole('button', { name: 'Excluir' }).click();
    
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    
    // <-- CORREÇÃO: Espera pelo toast com o texto exato.
    await expect(page.getByText('Viatura excluída com sucesso!')).toBeVisible();

    await expect(viaturaItemAtualizado).not.toBeVisible();
  });
});
