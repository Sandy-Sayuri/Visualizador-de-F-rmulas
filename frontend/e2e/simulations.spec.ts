import { expect, test } from '@playwright/test';

test('analyses a formula and animates locally without saving', async ({ page }) => {
  await page.goto('/simulations');

  await page.getByTestId('formula-main-input').fill('F = G * (m1 * m2) / r^2');
  await page.getByTestId('toggle-formula-scenario').click();

  await expect(page.getByTestId('formula-param-G')).toBeVisible();
  await expect(page.getByTestId('formula-param-m1')).toBeVisible();
  await expect(page.getByTestId('formula-param-m2')).toBeVisible();
  await expect(page.getByTestId('formula-category')).toContainText('Gravitacao');
  await expect(page.getByTestId('formula-particle-count')).toContainText('2');

  const formulaLegend = page.locator('[data-testid="canvas-legend"]').first();
  await expect(formulaLegend).toContainText('Forca');
  await expect(formulaLegend).toContainText('Rastro');

  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible();
  await expect(page.getByTestId('save-formula-scenario')).toHaveCount(0);
  await expect(page).toHaveURL(/\/simulations$/);
});

test('loads a saved simulation from the backend library and opens its details', async ({
  page,
  request,
}) => {
  const simulationName = `Teste integrado ${Date.now()}`;

  const createResponse = await request.post('http://127.0.0.1:3000/api/simulations', {
    data: {
      name: simulationName,
      description: 'Criado pelo e2e do sistema',
      bodies: [
        {
          name: 'Corpo A',
          mass: 1200,
          radius: 18,
          color: '#7ce6ff',
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
        },
      ],
    },
  });

  expect(createResponse.ok()).toBeTruthy();

  const createdSimulation = (await createResponse.json()) as { id: string; name: string };

  try {
    await page.goto('/simulations/library');

    await expect(page.getByRole('heading', { name: 'Experimentos salvos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: simulationName })).toBeVisible();

    await page.getByRole('button', { name: 'Ver detalhes' }).first().click();

    await expect(page).toHaveURL(new RegExp(`/simulations/${createdSimulation.id}$`));
    await expect(page.getByRole('heading', { name: simulationName })).toBeVisible();
    await expect(page.getByText('Criado pelo e2e do sistema')).toBeVisible();
  } finally {
    await request.delete(`http://127.0.0.1:3000/api/simulations/${createdSimulation.id}`);
  }
});

test('runs a guided optics reflection scene from the presets', async ({ page }) => {
  await page.goto('/simulations');

  await page.getByRole('button', { name: 'Reflexao' }).first().click();
  await expect(page.getByTestId('guided-scenario-card')).toBeVisible();
  await expect(page.getByTestId('formula-category')).toContainText('Optica');
  await expect(page.getByTestId('formula-param-angleDeg')).toBeVisible();
  await expect(page.getByTestId('formula-param-sourceX')).toBeVisible();
  await expect(page.getByTestId('formula-param-sourceY')).toBeVisible();

  await page.getByTestId('toggle-formula-scenario').click();

  const formulaLegend = page.locator('[data-testid="canvas-legend"]').first();
  await expect(formulaLegend).toContainText('Raios');
  await expect(formulaLegend).toContainText('Angulos');
});

test('runs an electromagnetism scene from the Coulomb formula', async ({ page }) => {
  await page.goto('/simulations');

  await page.getByRole('button', { name: 'Coulomb' }).first().click();
  await page.getByTestId('toggle-formula-scenario').click();

  await expect(page.getByTestId('formula-category')).toContainText('Eletromagnetismo');
  await expect(page.getByTestId('formula-particle-count')).toContainText('2');

  const formulaLegend = page.locator('[data-testid="canvas-legend"]').first();
  await expect(formulaLegend).toContainText('Campo');
  await expect(formulaLegend).toContainText('Forca');
});

test('runs a guided thermodynamics gas chamber with sliders and particle motion', async ({
  page,
}) => {
  await page.goto('/simulations');

  await page.getByRole('button', { name: /^Gas$/ }).click();
  await expect(page.getByTestId('guided-scenario-card')).toBeVisible();
  await expect(page.getByTestId('formula-category')).toContainText('Termodinamica');
  await expect(page.getByTestId('formula-param-temperature')).toBeVisible();
  await expect(page.getByTestId('formula-param-volume')).toBeVisible();
  await expect(page.getByTestId('formula-param-particleCount')).toBeVisible();

  await page.getByTestId('formula-param-temperature').evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, 620);
  await page.getByTestId('formula-param-volume').evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, 68);
  await page.getByTestId('toggle-formula-scenario').click();

  await expect(page.getByTestId('formula-particle-count')).toContainText('24');

  const formulaLegend = page.locator('[data-testid="canvas-legend"]').first();
  await expect(formulaLegend).toContainText('Particulas');
  await expect(formulaLegend).toContainText('Temperatura');
  await expect(formulaLegend).toContainText('Recipiente');
});
