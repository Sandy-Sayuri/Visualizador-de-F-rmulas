import { expect, test } from '@playwright/test';

test('analyses a formula and animates locally without saving', async ({ page }) => {
  await page.goto('/simulations');

  await page.getByTestId('simulation-name').fill('Formula Demo');
  await page.getByTestId('formula-main-input').fill('F = G * (m1 * m2) / r^2');
  await page.getByTestId('detect-formula-parameters').click();

  await expect(page.getByTestId('formula-category')).toContainText(
    'Interacao gravitacional',
  );
  await expect(page.getByTestId('formula-param-G')).toBeVisible();
  await expect(page.getByTestId('formula-param-m1')).toBeVisible();
  await expect(page.getByTestId('formula-param-m2')).toBeVisible();

  await page.getByTestId('apply-formula-scenario').click();
  await expect(page.getByTestId('formula-particle-count')).toContainText('2');

  const formulaLegend = page.locator('[data-testid="canvas-legend"]').first();
  await expect(formulaLegend).toContainText('Forca');
  await expect(formulaLegend).toContainText('Rastro');

  await page.getByTestId('toggle-formula-scenario').click();
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
  await expect(page.getByTestId('save-formula-scenario')).toHaveCount(0);
  await expect(page).toHaveURL(/\/simulations$/);
});
