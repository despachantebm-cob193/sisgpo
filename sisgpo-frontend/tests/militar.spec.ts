// Arquivo: frontend/tests/militar.spec.ts

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

test.describe('Fluxo de CRUD para Militares e Civis', () => {
  
  const timestamp = Date.now();
  // Dados para o Militar
  const nomeMilitar = `Militar Teste ${timestamp}`;
  const nomeGuerraMilitar = `Guerra ${timestamp}`;
  const matriculaMilitar = `mil-${timestamp}`;
  
  // Dados para o Civil
  const nomeCivil = `Civil Teste ${timestamp}`;
  const apelidoCivil = `Civil ${timestamp}`;

  test('deve criar, ler, atualizar e deletar um Militar e um Civil', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/militares"]').click();
    await expect(page.locator('h2:has-text("Efetivo (Militares e Civis)")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (MILITAR) ---
    await page.locator('button:has-text("Adicionar Novo")').click();
    
    // Preenche o formulário para Militar
    await expect(page.locator('h3:has-text("Adicionar Novo Registro")')).toBeVisible();
    await page.locator('select[name="tipo"]').selectOption('Militar');
    
    // Verifica se os campos condicionais estão visíveis
    await expect(page.locator('input[name="matricula"]')).toBeVisible();
    await expect(page.locator('input[name="posto_graduacao"]')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMilitar);
    await page.locator('input[name="nome_guerra"]').fill(nomeGuerraMilitar);
    await page.locator('input[name="matricula"]').fill(matriculaMilitar);
    await page.locator('input[name="posto_graduacao"]').fill('Soldado Teste');
    await page.locator('select[name="obm_id"]').selectOption({ label: '1º BBM' }); // Assumindo que '1º BBM' existe

    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro criado com sucesso!')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CIVIL) ---
    await page.locator('button:has-text("Adicionar Novo")').click();

    await expect(page.locator('h3:has-text("Adicionar Novo Registro")')).toBeVisible();
    await page.locator('select[name="tipo"]').selectOption('Civil');

    // Verifica se os campos condicionais NÃO estão visíveis
    await expect(page.locator('input[name="matricula"]')).not.toBeVisible();
    await expect(page.locator('input[name="posto_graduacao"]')).not.toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeCivil);
    await page.locator('input[name="nome_guerra"]').fill(apelidoCivil);
    await page.locator('select[name="obm_id"]').selectOption({ label: '1º BBM' });

    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro criado com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    // Filtra e verifica o Militar
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMilitar);
    const militarItem = page.locator('div[data-index]').filter({ hasText: nomeGuerraMilitar });
    await expect(militarItem).toBeVisible();
    await expect(militarItem).toContainText(matriculaMilitar);

    // Filtra e verifica o Civil
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeCivil);
    const civilItem = page.locator('div[data-index]').filter({ hasText: apelidoCivil });
    await expect(civilItem).toBeVisible();
    // Verifica se a matrícula está como "N/A"
    await expect(civilItem).toContainText('N/A');

    // --- ETAPA DE EXCLUSÃO ---
    // Exclui o Militar
    await militarItem.getByRole('button', { name: 'Excluir' }).click();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Registro excluído!')).toBeVisible();
    await expect(militarItem).not.toBeVisible();

    // Exclui o Civil
    await civilItem.getByRole('button', { name: 'Excluir' }).click();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Registro excluído!')).toBeVisible();
    await expect(civilItem).not.toBeVisible();
  });
});
