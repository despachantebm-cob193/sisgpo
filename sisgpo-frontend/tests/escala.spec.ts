// Arquivo: tests/escala.spec.ts (VERSÃO CORRIGIDA)

import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável e robusta
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  // Espera por um elemento do layout principal para garantir que a página carregou
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible({ timeout: 15000 });
}

test.describe('Fluxo de CRUD para Cadastro de Médicos', () => {
  const timestamp = Date.now();
  const nomeMedico = `Dr. Teste ${timestamp}`;
  const nomeMedicoAtualizado = `Dr. Atualizado ${timestamp}`;
  const funcao = 'Médico Regulador Teste';

  test('deve criar, ler, atualizar e deletar um médico', async ({ page }) => {
    await login(page);
    
    await page.getByRole('link', { name: 'Cadastro de Médicos' }).click();
    await expect(page.locator('h2:has-text("Cadastro de Médicos")')).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar Médico' }).click();
    await expect(page.locator('h3:has-text("Adicionar Médico")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMedico);
    await page.locator('input[name="funcao"]').fill(funcao);
    await page.locator('input[name="telefone"]').fill('62123456789');

    // --- CORREÇÃO APLICADA AQUI ---
    // Prepara para "escutar" a resposta da API ANTES de clicar no botão
    const createResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/civis') && response.status() === 201
    );
    await page.getByRole('button', { name: 'Salvar' }).click();
    // Agora, espera a resposta da API ter chegado com sucesso
    await createResponsePromise;
    // --- FIM DA CORREÇÃO ---

    // A mensagem de toast agora deve estar visível
    await expect(page.getByText('Médico criado com sucesso!')).toBeVisible();
    
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMedico);
    const registroItem = page.locator('tr').filter({ hasText: nomeMedico });
    await expect(registroItem).toBeVisible();
    await expect(registroItem).toContainText(funcao);

    await registroItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Médico")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMedicoAtualizado);
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText('Médico atualizado com sucesso!')).toBeVisible();

    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMedicoAtualizado);
    const registroAtualizado = page.locator('tr').filter({ hasText: nomeMedicoAtualizado });
    await expect(registroAtualizado).toBeVisible();

    await registroAtualizado.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Confirmar Exclusão' }).click();
    await expect(page.getByText('Registro excluído!')).toBeVisible();
    await expect(registroAtualizado).not.toBeVisible();
  });
});
