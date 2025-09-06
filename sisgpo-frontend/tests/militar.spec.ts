import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.locator('input[id="login"]').fill('admin');
  await page.locator('input[id="senha"]').fill('cbmgo@2025');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Bem-vindo, admin')).toBeVisible();
}

test.describe('Fluxo de CRUD para Militares', () => {
  const timestamp = Date.now();
  const nomeMilitar = `Militar de Teste ${timestamp}`;
  const nomeGuerraMilitar = `Guerra ${timestamp}`;
  const matriculaMilitar = `mat-${timestamp}`;
  const nomeObmParaBusca = '1º BBM';

  test('deve criar, ler, atualizar e deletar um Militar', async ({ page }) => {
    await login(page);
    await page.locator('a[href="/militares"]').click();
    await expect(page.locator('h2:has-text("Efetivo (Militares)")')).toBeVisible();

    await page.locator('button:has-text("Adicionar Militar")').click();
    await expect(page.locator('h3:has-text("Adicionar Novo Militar")')).toBeVisible();

    await page.locator('input[name="nome_completo"]').fill(nomeMilitar);
    await page.locator('input[name="nome_guerra"]').fill(nomeGuerraMilitar);
    await page.locator('input[name="matricula"]').fill(matriculaMilitar);
    await page.locator('input[name="posto_graduacao"]').fill('Soldado de Teste');

    const obmSelectContainer = page.locator('#obm_id').locator('..');
    await obmSelectContainer.click();

    const obmSearchResponsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/obms/search') && response.status() === 200
    );

    await obmSelectContainer.locator('input').fill(nomeObmParaBusca);
    await obmSearchResponsePromise;

    // --- CORREÇÃO FINAL APLICADA AQUI ---
    // Em vez de page.getByText, usamos um seletor mais específico para as opções do react-select.
    // Este seletor busca por um div que contenha o texto da OBM, o que é mais confiável.
    await page.locator('div[id*="react-select-"][id*="-option-"]').filter({ hasText: nomeObmParaBusca }).click();
    // --- FIM DA CORREÇÃO ---

    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Militar criado com sucesso!')).toBeVisible();

    await page.locator('input[placeholder="Filtrar por nome..."]').fill(nomeMilitar);
    const militarItem = page.locator('div[data-index]').filter({ hasText: nomeMilitar });
    await expect(militarItem).toBeVisible({ timeout: 10000 });
    await expect(militarItem).toContainText(matriculaMilitar);

    await militarItem.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('h3:has-text("Editar Militar")')).toBeVisible();
    await page.locator('input[name="posto_graduacao"]').fill('Cabo de Teste');
    await page.locator('button:has-text("Salvar")').click();
    await expect(page.getByText('Militar atualizado com sucesso!')).toBeVisible();

    await expect(militarItem).toContainText('Cabo de Teste');

    await militarItem.getByRole('button', { name: 'Excluir' }).click();
    await page.locator('button:has-text("Confirmar Exclusão")').click();
    await expect(page.getByText('Militar excluído!')).toBeVisible();
    
    await expect(militarItem).not.toBeVisible();
  });
});
