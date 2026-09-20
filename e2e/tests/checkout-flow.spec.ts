import { expect, test } from '@playwright/test';
import { ADMIN, PDF_COMPROVATIVO } from './fixtures';

test('registo → checkout com comprovativo → admin confirma pagamento', async ({ page }) => {
  const stamp = Date.now();
  const email = `cliente-${stamp}@e2e.vantagem.test`;
  const password = 'ClienteE2e99';

  await page.goto('/registo');
  await page.locator('#reg-nome').fill('Cliente E2E');
  await page.locator('#reg-email').fill(email);
  await page.locator('#reg-tel').fill('923456789');
  await page.locator('#reg-passe').fill(password);
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(/\/conta/, { timeout: 20_000 });

  await page.goto('/catalogo');
  await expect(page.getByText('Cabo USB-C E2E')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: '+ Carrinho' }).first().click();

  await page.goto('/carrinho');
  await page.getByRole('link', { name: 'Finalizar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();

  await page.locator('#chk-nome').fill('Cliente E2E');
  await page.locator('#chk-email').fill(email);
  await page.locator('#chk-morada').fill('Rua Rainha Ginga 1');
  await page.locator('#chk-cidade').fill('Luanda');
  await page.locator('#chk-tel').fill('923456789');
  await page.getByRole('button', { name: 'Continuar para pagamento' }).click();

  await page.locator('#chk-comprovativo').setInputFiles({
    name: 'comprovativo.pdf',
    mimeType: 'application/pdf',
    buffer: PDF_COMPROVATIVO,
  });
  await page.getByRole('button', { name: /Confirmar encomenda/ }).click();

  await expect(page).toHaveURL(/\/pedido\//, { timeout: 30_000 });
  const referencia = page.url().split('/pedido/')[1]?.split(/[?#]/)[0] ?? '';
  expect(referencia.length).toBeGreaterThan(3);
  await expect(page.getByRole('heading', { name: 'Comprovativo recebido' })).toBeVisible();

  await page.goto('/conta');
  await page.getByRole('button', { name: 'Sair' }).first().click();
  await expect(page).toHaveURL(/\/login/);

  await page.locator('#login-email').fill(ADMIN.email);
  await page.locator('#login-passe').fill(ADMIN.password);
  await page.getByRole('button', { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });

  await page.goto('/admin/pedidos?filtro=comprovativos');
  await expect(page.getByRole('button', { name: 'Confirmar pagamento' }).first()).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: 'Confirmar pagamento' }).first().click();
  await page.getByRole('button', { name: 'Sim, pagamento confirmado' }).click();
  await expect(page.getByText('Não há comprovativos à espera')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Sair' }).first().click();
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-passe').fill(password);
  await page.getByRole('button', { name: /^Entrar$/ }).click();
  await expect(page).toHaveURL(/\/conta/, { timeout: 20_000 });

  await page.goto(`/pedido/${referencia}`);
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado' })).toBeVisible({
    timeout: 20_000,
  });
});
