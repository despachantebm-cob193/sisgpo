// Arquivo: frontend/tests/civil.spec.ts (Novo)

import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
}

test.describe('Fluxo de CRUD para Civis', () => {
  const timestamp = Date.now();
  const nomeCivil = `Civil Teste ${timestamp}`;
  const apelidoCivil = `Apelido ${timestamp}`;
  const nomeCivilAtualizado = `Civil Atualizado ${timestamp}`;

  test('deve criar, ler, atualizar e deletar um Civil', async ({ page }) => {
    // 1. Login e Navegação para a página de Civis
    await login(page);
    await page.locator('a[href="/civis"]').click();
    await expect(page.locator('h2:has-text("Efetivo (Civis)")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Novo")').click();
    await expect(page.locator('h3:has-text("Adicionar Novo Civil")')).toBeVisible();

    // Preenchimento do formulário de criação
    await page.locator('input[name="nome_completo"]').fill(nomeCivil);
    await page.locator('input[name="apelido"]').fill(apelidoCivil);
    await page.locator('select[name="obm_id"]').selectOption({ index: 1 }); // Seleciona a primeira OBM da lista

    // Salva e verifica a notificação de sucesso
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro criado com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    // Filtra pelo nome do civil recém-criado
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeCivil);

    // Localiza o item na lista e verifica sua visibilidade e conteúdo
    const civilItem = page.locator(`div[data-index]`).filter({ hasText: nomeCivil });
    await expect(civilItem).toBeVisible({ timeout: 10000 });
    await expect(civilItem).toContainText(apelidoCivil);

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await civilItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Registro")')).toBeVisible();

    // Altera o nome completo e salva
    await page.locator('input[name="nome_completo"]').fill(nomeCivilAtualizado);
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro atualizado com sucesso!')).toBeVisible();

    // Verifica se a lista foi atualizada com o novo nome
    const civilItemAtualizado = page.locator(`div[data-index]`).filter({ hasText: nomeCivilAtualizado });
    await expect(civilItemAtualizado).toBeVisible();
    await expect(civilItem).not.toBeVisible(); // O item com o nome antigo não deve mais estar visível

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await civilItemAtualizado.getByRole('button', { name: 'Excluir' }).click();
    
    // Confirma a exclusão no modal
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Registro excluído!')).toBeVisible();
    
    // Verifica se o item desapareceu completamente da lista
    await expect(civilItemAtualizado).not.toBeVisible();
  });
});
