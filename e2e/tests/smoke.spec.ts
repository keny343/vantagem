import { expect, test } from '@playwright/test';

test('loja carrega catálogo e página de produto E2E', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

  await page.goto('/catalogo');
  await expect(page.getByText('Cabo USB-C E2E')).toBeVisible({ timeout: 20_000 });

  await page.getByRole('link', { name: 'Cabo USB-C E2E' }).first().click();
  await expect(page.getByRole('heading', { name: 'Cabo USB-C E2E' })).toBeVisible();
});
