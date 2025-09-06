// Arquivo: frontend/tests/obm.spec.ts (COM A CORREÇÃO)

import { test, expect, Page } from '@playwright/test';

// A baseURL é definida no arquivo playwright.config.ts, então não precisamos dela aqui.

// --- Função Auxiliar para Login ---
async function login(page: Page) {
  // Usa caminhos relativos, que são combinados com a baseURL da configuração
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  // Usa noWaitAfter para maior resiliência, como no teste de autenticação
  await page.locator('button[type="submit"]').click({ noWaitAfter: true });
  // A asserção de sucesso do login agora verifica o cabeçalho, que é mais rápido e estável
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
    await page.locator('input[name="nome"]').fill(nomeObmTeste);
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
    await page.locator('input[name="nome"]').fill(nomeObmAtualizado);
    await page.locator('button:has-text("Salvar")').click();
    
    await expect(page.getByText('OBM atualizada com sucesso!')).toBeVisible();

    // Verifica se o item foi realmente atualizado na lista
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeObmAtualizado);
    const obmItemAtualizado = page.locator('div[data-index]').filter({ hasText: nomeObmAtualizado });
    await expect(obmItemAtualizado).toBeVisible();
    
    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await obmItemAtualizado.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.locator('h3:has-text("Confirmar Exclusão")')).toBeVisible();
    await page.locator('button:has-text("Confirmar Exclusão")').click();

    await expect(page.getByText('OBM excluída com sucesso!')).toBeVisible();
    
    await expect(obmItemAtualizado).not.toBeVisible();
  });
});
