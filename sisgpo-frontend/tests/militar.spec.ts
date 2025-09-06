// Arquivo: frontend/tests/militar.spec.ts (Versão Corrigida e Simplificada)

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

test.describe('Fluxo de CRUD para Militares', () => {
  const timestamp = Date.now();
  const nomeMilitar = `Militar Teste ${timestamp}`;
  const nomeGuerraMilitar = `Guerra ${timestamp}`;
  const matriculaMilitar = `mil-${timestamp}`;

  test('deve criar, ler, atualizar e deletar um Militar', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/militares"]').click();
    await expect(page.locator('h2:has-text("Efetivo (Militares)")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Militar")').click();
    await expect(page.locator('h3:has-text("Adicionar Novo Militar")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMilitar);
    await page.locator('input[name="nome_guerra"]').fill(nomeGuerraMilitar);
    await page.locator('input[name="matricula"]').fill(matriculaMilitar);
    await page.locator('input[name="posto_graduacao"]').fill('Soldado de Teste');
    await page.locator('select[name="obm_id"]').selectOption({ index: 1 });

    const createResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/militares') && response.status() === 201
    );
    await page.locator('button:has-text("Salvar")').click();
    await createResponsePromise;
    await expect(page.getByText('Militar criado com sucesso!')).toBeVisible();

    // --- ETAPA DE LEITURA (READ) ---
    
    // **CORREÇÃO APLICADA AQUI:**
    // Removemos a espera pela resposta da API (waitForResponse).
    // Apenas preenchemos o filtro e vamos direto para a verificação do resultado.
    // O Playwright aguardará automaticamente (auto-waiting) pelo elemento aparecer.
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMilitar);

    // A verificação agora é feita diretamente no elemento da lista.
    const militarItem = page.locator(`div[data-index]`).filter({ hasText: nomeMilitar });
    await expect(militarItem).toBeVisible({ timeout: 10000 }); // Aumentamos o timeout para dar margem à renderização
    await expect(militarItem).toContainText(matriculaMilitar);

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await militarItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Militar")')).toBeVisible();
    await page.locator('input[name="posto_graduacao"]').fill('Cabo de Teste');
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Militar atualizado com sucesso!')).toBeVisible();

    await expect(militarItem).toContainText('Cabo de Teste');

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await militarItem.getByRole('button', { name: 'Excluir' }).click();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Militar excluído!')).toBeVisible();
    
    await expect(militarItem).not.toBeVisible();
  });
});
