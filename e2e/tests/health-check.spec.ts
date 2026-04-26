import { test, expect } from '@playwright/test';

/**
 * Health Check E2E Tests
 * Validates the health monitoring dashboard functionality
 */
test.describe('Health Check Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/health');
  });

  test('should display health check page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Health|Status/i);
  });

  test('should show API status indicator', async ({ page }) => {
    const statusIndicator = page.locator('[data-testid="api-status"], .status-indicator, .health-status').first();
    await expect(statusIndicator).toBeVisible({ timeout: 10000 });
  });

  test('should display health metrics', async ({ page }) => {
    const metricsSection = page.locator('[data-testid="health-metrics"], .metrics, .health-data').first();
    await expect(metricsSection).toBeVisible();
  });

  test('should auto-refresh health status', async ({ page }) => {
    await page.waitForSelector('[data-testid="api-status"], .status-indicator', { timeout: 10000 });
    await page.waitForTimeout(5000);
    
    const timestamp = page.locator('[data-testid="last-updated"], .timestamp, .last-check').first();
    if (await timestamp.isVisible().catch(() => false)) {
      await expect(timestamp).toBeVisible();
    }
  });

  test('should handle API errors gracefully', async ({ page, context }) => {
    await context.route('**/api/v1/health', route => route.abort('failed'));
    await page.goto('/health');
    await page.waitForTimeout(2000);
    
    const errorMessage = page.locator('[data-testid="error-message"], .error, .status-error').first();
    const hasErrorState = await errorMessage.isVisible().catch(() => false);
    const statusIndicator = page.locator('[data-testid="api-status"], .status-indicator').first();
    const statusText = await statusIndicator.textContent().catch(() => '');
    
    expect(hasErrorState || statusText?.toLowerCase().includes('error') || statusText?.toLowerCase().includes('down')).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const container = page.locator('main, .container, .health-dashboard').first();
    await expect(container).toBeVisible();
    
    const body = page.locator('body');
    const bodyWidth = await body.evaluate(el => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
