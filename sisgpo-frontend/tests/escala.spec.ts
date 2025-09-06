import { test, expect, Page } from '@playwright/test';

// Função de login reutilizável para manter o código limpo
async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
}

test.describe('Fluxo de CRUD para Escala de Médicos', () => {
  const timestamp = Date.now();
  const nomeMedico = `Dr. Teste ${timestamp}`;
  const nomeMedicoAtualizado = `Dr. Atualizado ${timestamp}`;
  const funcao = 'Médico Regulador Teste';

  test('deve criar, ler, atualizar e deletar um registro na escala', async ({ page }) => {
    // 1. Login e Navegação
    await login(page);
    await page.locator('a[href="/civis"]').click(); // A rota da API/frontend ainda é /civis
    await expect(page.locator('h2:has-text("Escala de Serviço (Médicos)")')).toBeVisible();

    // --- ETAPA DE CRIAÇÃO (CREATE) ---
    await page.locator('button:has-text("Adicionar Registro")').click();
    await expect(page.locator('h3:has-text("Adicionar Registro na Escala")')).toBeVisible();

    // Preenchimento do formulário
    await page.locator('input[name="nome_completo"]').fill(nomeMedico);
    await page.locator('input[name="funcao"]').fill(funcao);
    await page.locator('input[name="entrada_servico"]').fill('2025-10-20T07:00');
    await page.locator('input[name="saida_servico"]').fill('2025-10-20T19:00');
    await page.locator('select[name="status_servico"]').selectOption('Presente');
    await page.locator('textarea[name="observacoes"]').fill('Observação de teste inicial.');

    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro de escala criado com sucesso!')).toBeVisible();
    
    // --- ETAPA DE LEITURA (READ) - CORREÇÃO APLICADA ---
    // 1. Preenche o campo de filtro com o nome único do registro criado.
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMedico);
    
    // 2. Localiza o item na lista. O Playwright aguardará automaticamente que o elemento apareça.
    //    Isso substitui a busca em uma lista paginada.
    const registroItem = page.locator('tr').filter({ hasText: nomeMedico });
    
    // 3. Verifica se o item está visível e contém os dados corretos.
    await expect(registroItem).toBeVisible({ timeout: 10000 });
    await expect(registroItem).toContainText(funcao);
    await expect(registroItem).toContainText('Presente');

    // --- ETAPA DE ATUALIZAÇÃO (UPDATE) ---
    await registroItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Registro de Escala")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMedicoAtualizado);
    await page.locator('select[name="status_servico"]').selectOption('Ausente');
    await page.locator('textarea[name="observacoes"]').fill('Observação atualizada.');

    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Registro de escala atualizado com sucesso!')).toBeVisible();

    // Filtra novamente pelo nome atualizado para garantir que a busca funcione
    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMedicoAtualizado);
    const registroAtualizado = page.locator('tr').filter({ hasText: nomeMedicoAtualizado });
    await expect(registroAtualizado).toBeVisible();
    await expect(registroAtualizado).toContainText('Ausente');

    // --- ETAPA DE EXCLUSÃO (DELETE) ---
    await registroAtualizado.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.locator('h3:has-text("Confirmar Exclusão")')).toBeVisible();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Registro excluído!')).toBeVisible();
    
    // Garante que o item não está mais na lista após a exclusão
    await expect(registroAtualizado).not.toBeVisible();
  });
});
