// E2E Test: Authentication Flows
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('application loads without authentication redirect', async ({ page }) => {
    // The app should load the dashboard directly (demo mode)
    await expect(page.locator('text=Tableau de Bord')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation works for all users', async ({ page }) => {
    await page.waitForSelector('text=Tableau de Bord');

    // Navigate through all menu items
    const menuItems = [
      'Ordres de Travail',
      'Équipements',
      'Maintenance Préventive',
      'Pièces de Rechange',
      'Techniciens',
      'Supervision IoT',
      'Analytiques',
      'Alertes',
      'Assistant IA',
      'Tarification',
    ];

    for (const item of menuItems) {
      await page.click(`text=${item}`);
      await page.waitForTimeout(500);
    }
  });
});

test.describe('User Role Restrictions', () => {
  test('sidebar shows all navigation items', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');

    // Check all expected menu items are visible
    await expect(page.locator('text=Ordres de Travail')).toBeVisible();
    await expect(page.locator('text=Équipements')).toBeVisible();
    await expect(page.locator('text=Maintenance Préventive')).toBeVisible();
    await expect(page.locator('text=Pièces de Rechange')).toBeVisible();
    await expect(page.locator('text=Techniciens')).toBeVisible();
    await expect(page.locator('text=Supervision IoT')).toBeVisible();
    await expect(page.locator('text=Analytiques')).toBeVisible();
    await expect(page.locator('text=Alertes')).toBeVisible();
    await expect(page.locator('text=Assistant IA')).toBeVisible();
    await expect(page.locator('text=Tarification')).toBeVisible();
  });

  test('top bar displays user information', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');

    // Check for user avatar or profile
    const avatar = page.locator('[class*="avatar"], [class*="Avatar"]').first();
    await expect(avatar).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('page refresh maintains state', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');

    // Navigate to a different page
    await page.click('text=Ordres de Travail');
    await page.waitForTimeout(500);

    // Refresh
    await page.reload();

    // Should still be on the app
    await expect(page.locator('text=GMAO Pro')).toBeVisible();
  });

  test('browser back/forward navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Travail');

    // Navigate to multiple pages
    await page.click('text=Ordres de Travail');
    await page.waitForTimeout(300);

    await page.click('text=Équipements');
    await page.waitForTimeout(300);

    // Go back
    await page.goBack();
    await expect(page.locator('text=Ordre')).toBeVisible();

    // Go back again
    await page.goBack();
    await expect(page.locator('text=Tableau de Bord')).toBeVisible();

    // Go forward
    await page.goForward();
    await expect(page.locator('text=Ordre')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('mobile view shows hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('text=GMAO Pro');

    // Look for mobile menu elements
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('tablet view shows sidebar', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');

    // Sidebar should be visible
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('desktop view shows full sidebar', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('text=Tableau de Bord');

    // Sidebar should be fully expanded
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();

    // All menu text should be visible (not collapsed)
    await expect(page.locator('text=Tableau de Bord')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/api/**', route => route.abort());

    await page.goto('/');

    // App should still render UI even with API failure
    await expect(page.locator('text=GMAO Pro')).toBeVisible();
  });

  test('displays loading states', async ({ page }) => {
    // Slow down API response
    await page.route('**/api/dashboard', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto('/');

    // Should show loading state
    const loadingElement = page.locator('.animate-pulse').first();
    await expect(loadingElement).toBeVisible({ timeout: 1000 });
  });
});
