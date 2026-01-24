// Arquivo: tests/militar.spec.ts

import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável e robusta
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('timbo.correa@gmail.com');
  await page.locator('input[id="senha"]').fill('22091975');
  await page.locator('button[type="submit"]').click();
  // **A CORREÇÃO MAIS IMPORTANTE:** Espera por um elemento do layout principal
  // para garantir que a página carregou antes de prosseguir.
  await expect(page.getByText('Alexandre')).toBeVisible({ timeout: 15000 });
}

test.describe('Fluxo de CRUD para Militares', () => {
  const timestamp = Date.now();
  const nomeMilitar = `Militar Teste ${timestamp}`;
  const nomeGuerraMilitar = `Guerra ${timestamp}`;
  const matriculaMilitar = `mil-${timestamp}`;

  test('deve criar, ler, atualizar e deletar um Militar', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);

    // Use getByRole para uma seleção mais semântica e robusta
    await page.getByRole('link', { name: 'Militares' }).click();
    await expect(page.locator('h1:has-text("Efetivo (Militares)")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.getByRole('button', { name: 'Adicionar Militar' }).click();
    await expect(page.locator('h3:has-text("Adicionar Novo Militar")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMilitar);
    await page.locator('input[name="nome_guerra"]').fill(nomeGuerraMilitar);
    await page.locator('input[name="matricula"]').fill(matriculaMilitar);
    await page.locator('input[name="posto_graduacao"]').fill('Soldado Teste');
    await page.locator('input[name="obm_nome"]').fill('1º BBM (Teste)');

    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Militar criado com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMilitar);
    const militarItem = page.locator('tr').filter({ hasText: nomeMilitar });
    await expect(militarItem).toBeVisible();
    await expect(militarItem).toContainText(matriculaMilitar);

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await militarItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Militar")')).toBeVisible();
    await page.locator('input[name="posto_graduacao"]').fill('Cabo de Teste');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Militar atualizado com sucesso!')).toBeVisible();
    await expect(militarItem).toContainText('Cabo de Teste');

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await militarItem.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    await expect(page.getByText('Militar excluído com sucesso!')).toBeVisible();
    await expect(militarItem).not.toBeVisible();
  });
});
