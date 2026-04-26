import { test, expect } from '@playwright/test';

/**
 * Cross-Browser Compatibility Tests
 * Validates consistent behavior across browsers
 */
test.describe('Cross-Browser Compatibility', () => {
  test('should render consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
      maxDiffPixels: 100,
    });
  });

  test('health page should render consistently', async ({ page, browserName }) => {
    await page.goto('/health');
    await page.waitForTimeout(3000);
    
    await expect(page).toHaveScreenshot(`health-page-${browserName}.png`, {
      maxDiffPixels: 100,
    });
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1366, height: 768, name: 'laptop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20);
    }
  });
});
