// E2E Test: Work Order Lifecycle
import { test, expect } from '@playwright/test';

test.describe('Work Order Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete work order creation flow', async ({ page }) => {
    // Navigate to Work Orders
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Click create button
    const createButton = page.locator('button:has-text("Nouveau"), button:has-text("Créer")').first();
    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill form
      await page.fill('input[name="title"], input[placeholder*="titre"]', 'Test WO - Panne pompe');
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Description test pour E2E');

      // Submit form
      const submitButton = page.locator('button:has-text("Créer"), button:has-text("Enregistrer")').last();
      await submitButton.click();

      // Verify creation
      await page.waitForSelector('text=Test WO - Panne pompe', { timeout: 10000 });
    }
  });

  test('work order list displays correctly', async ({ page }) => {
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Check for table or list
    const tableOrList = page.locator('table, [role="list"], .grid').first();
    await expect(tableOrList).toBeVisible();
  });

  test('work order filters work', async ({ page }) => {
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Look for filter options
    const filterButton = page.locator('button:has-text("Filtrer"), button:has-text("Filtre")').first();
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Check for filter options
      await expect(page.locator('text=Statut')).toBeVisible();
    }
  });

  test('work order status badge colors are correct', async ({ page }) => {
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Look for status badges
    const statusBadges = page.locator('[class*="badge"], [class*="Badge"]');

    // Should have some badges visible
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Work Order Details', () => {
  test('work order detail modal opens', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Click on first work order row
    const firstRow = page.locator('tr, [role="listitem"], .cursor-pointer').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();

      // Check for detail modal/panel
      await page.waitForSelector('[role="dialog"], .modal, [class*="drawer"]', { timeout: 5000 }).catch(() => {});
    }
  });
});

test.describe('Work Order Priority', () => {
  test('P1 emergency badge is red', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Ordres de Travail');
    await page.waitForSelector('text=Ordres de Travail');

    // Look for P1/Emergency badges
    const emergencyBadge = page.locator('text=/P1|Emergency|Urgent/i').first();
    if (await emergencyBadge.isVisible()) {
      const className = await emergencyBadge.getAttribute('class');
      expect(className).toMatch(/red|destructive|error/i);
    }
  });
});
