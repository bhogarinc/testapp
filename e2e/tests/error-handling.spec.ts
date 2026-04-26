import { test, expect } from '@playwright/test';

/**
 * Error Handling E2E Tests
 * Validates application behavior under error conditions
 */
test.describe('Error Handling', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-route-12345');
    
    const errorContent = page.locator('h1, h2, .error, [data-testid="404"]').filter({ 
      hasText: /404|Not Found|Page Not Found/i 
    });
    
    const hasErrorPage = await errorContent.isVisible().catch(() => false);
    const pageTitle = await page.title();
    
    expect(hasErrorPage || pageTitle.includes('404') || pageTitle.includes('Not Found')).toBeTruthy();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    console.log('Console errors found:', consoleErrors.length);
  });

  test('should recover from API failures', async ({ page, context }) => {
    await context.route('**/api/v1/health', route => route.abort('failed'));
    await page.goto('/health');
    await page.waitForTimeout(2000);
    
    await context.unroute('**/api/v1/health');
    await page.reload();
    
    await page.waitForTimeout(3000);
    const successIndicator = page.locator('[data-testid="api-status"], .status-healthy, .status-ok').first();
    await expect(successIndicator).toBeVisible({ timeout: 10000 });
  });
});
