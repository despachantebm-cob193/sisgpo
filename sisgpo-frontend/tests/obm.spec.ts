// Arquivo: frontend/tests/obm.spec.ts (VERSÃO FINALMENTE CORRETA)

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

test.describe('Fluxo de CRUD para OBMs', () => {
  
  const timestamp = Date.now();
  const nomeObmTeste = `Batalhão de Teste Playwright ${timestamp}`;
  const abreviaturaObmTeste = `BTP-${timestamp}`;
  const nomeObmAtualizado = `Batalhão Atualizado ${timestamp}`;

  test('deve criar, ler, atualizar e deletar uma OBM', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/obms"]').click();
    await expect(page.locator('h2:has-text("OBMs")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Nova OBM")').click();
    
    await page.locator('input[name="nome"]').fill(nomeObmTeste);
    await page.locator('input[name="abreviatura"]').fill(abreviaturaObmTeste);
    await page.locator('input[name="cidade"]').fill('Cidade Teste');
    await page.locator('input[name="telefone"]').fill('999999999');
    
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.locator('h3:has-text("Adicionar Nova OBM")')).not.toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeObmTeste);

    const obmItemOriginal = page.locator('div[data-index]').filter({ hasText: nomeObmTeste });
    await expect(obmItemOriginal).toBeVisible();
    await expect(obmItemOriginal).toContainText(abreviaturaObmTeste);

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await obmItemOriginal.getByRole('button', { name: 'Editar' }).click();

    await expect(page.locator('h3:has-text("Editar OBM")')).toBeVisible();
    await page.locator('input[name="nome"]').fill(nomeObmAtualizado);
    await page.locator('button:has-text("Salvar")').click();

    // <-- CORREÇÃO: Após atualizar, buscamos o item novamente com o novo nome.
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeObmAtualizado);
    
    // Redefine a variável para apontar para o novo estado do item.
    const obmItemAtualizado = page.locator('div[data-index]').filter({ hasText: nomeObmAtualizado });
    await expect(obmItemAtualizado).toBeVisible();
    
    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await obmItemAtualizado.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.locator('h3:has-text("Confirmar Exclusão")')).toBeVisible();
    await page.locator('button:has-text("Confirmar Exclusão")').click();

    // Após a exclusão, o item não deve mais ser encontrado.
    await expect(obmItemAtualizado).not.toBeVisible();
  });
});
