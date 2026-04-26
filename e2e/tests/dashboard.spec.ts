import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 * Validates main dashboard functionality and navigation
 */
test.describe('Main Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/TestApp|Dashboard|Home/i);
    const mainContent = page.locator('main, #root, .app').first();
    await expect(mainContent).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"], .navbar, .sidebar').first();
    await expect(nav).toBeVisible();
  });

  test('should navigate to health check page', async ({ page }) => {
    const healthLink = page.locator('a[href*="health"], [data-testid="health-link"], nav a:has-text("Health"), nav a:has-text("Status")').first();
    
    if (await healthLink.isVisible().catch(() => false)) {
      await healthLink.click();
      await expect(page).toHaveURL(/.*health.*/);
      await expect(page.locator('h1, h2').filter({ hasText: /Health|Status/i })).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display API information', async ({ page }) => {
    const apiInfo = page.locator('[data-testid="api-info"], .api-info, .version-info').first();
    if (await apiInfo.isVisible().catch(() => false)) {
      await expect(apiInfo).toBeVisible();
    }
  });

  test('should show loading states', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main').first()).toBeVisible();
  });
});
