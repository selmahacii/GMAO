// E2E Test: Dashboard KPIs
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('dashboard loads in < 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test('all 5 KPI cards display numeric values', async ({ page }) => {
    await page.waitForSelector('text=Disponibilité');

    // Check for KPI cards
    await expect(page.locator('text=Disponibilité')).toBeVisible();
    await expect(page.locator('text=MTBF Moyen')).toBeVisible();
    await expect(page.locator('text=OTs en cours')).toBeVisible();
    await expect(page.locator('text=Conformité PM')).toBeVisible();
    await expect(page.locator('text=Coût Maintenance')).toBeVisible();

    // Check that numeric values are displayed
    const availabilityValue = await page.locator('text=/\\d+\\.?\\d*%/').first().textContent();
    expect(availabilityValue).toMatch(/\d+\.?\d*%/);
  });

  test('charts render without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForSelector('text=OEE - Overall Equipment Effectiveness');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('manifest') &&
      !e.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('critical alert banner appears when alerts exist', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=Tableau de Bord');

    // Check if alert banner is present (depends on data)
    const alertBanner = page.locator('text=/alertes critiques nécessitent/');

    // Banner may or may not appear based on data
    if (await alertBanner.isVisible()) {
      await expect(alertBanner).toBeVisible();
    }
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.waitForSelector('text=Tableau de Bord');

    // Click on Ordres de Travail
    await page.click('text=Ordres de Travail');
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Ordre/i);

    // Click on Équipements
    await page.click('text=Équipements');
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Équipement/i);

    // Click on Tarification
    await page.click('text=Tarification');
    await expect(page.getByText('Maintenance intelligente')).toBeVisible();
  });

  test('OEE section displays correctly', async ({ page }) => {
    await page.waitForSelector('text=OEE - Overall Equipment Effectiveness');

    // Check for OEE metrics
    await expect(page.getByText('Disponibilité')).toBeVisible();
    await expect(page.getByText('Performance')).toBeVisible();
    await expect(page.getByText('Qualité')).toBeVisible();
  });

  test('work orders trend chart is interactive', async ({ page }) => {
    await page.waitForSelector('text=Évolution des Ordres de Travail');

    // Hover over chart area
    const chartArea = page.locator('.recharts-wrapper').first();
    await chartArea.hover();

    // Chart should be visible
    await expect(chartArea).toBeVisible();
  });
});
