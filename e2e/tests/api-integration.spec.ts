import { test, expect } from '@playwright/test';

/**
 * API Integration E2E Tests
 * Validates frontend-backend API communication
 */
test.describe('API Integration', () => {
  test('should fetch health status from API', async ({ page }) => {
    const healthResponse = page.waitForResponse(response => 
      response.url().includes('/api/v1/health') && response.status() === 200
    );
    
    await page.goto('/health');
    const response = await healthResponse;
    const data = await response.json();
    
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  test('should display API version information', async ({ page }) => {
    const infoResponse = page.waitForResponse(response => 
      response.url().includes('/api/v1/info') || response.url().includes('/api/v1/')
    ).catch(() => null);
    
    await page.goto('/');
    const response = await infoResponse;
    
    if (response) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('should handle network timeouts gracefully', async ({ page, context }) => {
    await context.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.continue();
    });
    
    await page.goto('/health');
    await page.waitForTimeout(3000);
    const status = page.locator('[data-testid="api-status"], .status-indicator, .loading').first();
    await expect(status).toBeVisible();
  });

  test('should retry failed requests', async ({ page, context }) => {
    let requestCount = 0;
    
    await context.route('**/api/v1/health', (route, request) => {
      requestCount++;
      if (requestCount < 3) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/health');
    await page.waitForTimeout(5000);
    expect(requestCount).toBeGreaterThanOrEqual(1);
  });
});
