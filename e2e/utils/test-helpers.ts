import { Page, expect } from '@playwright/test';

/**
 * E2E Test Helper Functions
 */
export async function waitForHealthStatus(page: Page, expectedStatus: 'healthy' | 'degraded' | 'unhealthy' | 'error', timeout = 10000) {
  const statusIndicator = page.locator('[data-testid="api-status"], .status-indicator, .health-status').first();
  
  await expect(statusIndicator).toBeVisible({ timeout });
  
  const statusText = await statusIndicator.textContent() || '';
  const normalizedStatus = statusText.toLowerCase();
  
  expect(normalizedStatus).toContain(expectedStatus.toLowerCase());
}

export async function mockHealthApi(page: Page, response: object, status = 200) {
  await page.route('**/api/v1/health', async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

export async function mockApiError(page: Page, endpoint: string, status = 500) {
  await page.route(`**${endpoint}`, async route => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}

export async function clearApiMocks(page: Page) {
  await page.unrouteAll();
}

export async function takeScreenshotOnFailure(page: Page, testName: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${testName}-${timestamp}.png`,
    fullPage: true 
  });
}

export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function verifyPageLoaded(page: Page, expectedElements: string[]) {
  for (const selector of expectedElements) {
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();
  }
}
