import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests
 * Validates WCAG compliance
 */
test.describe('Accessibility', () => {
  test('should not have automatically detectable accessibility issues on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on health page', async ({ page }) => {
    await page.goto('/health');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const level = parseInt(await heading.evaluate(el => el.tagName.toLowerCase().replace('h', '')));
      expect(level).toBeGreaterThanOrEqual(previousLevel === 0 ? 1 : previousLevel - 1);
      previousLevel = level;
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    let tabCount = 0;
    while (tabCount < 10) {
      await page.keyboard.press('Tab');
      const focusable = page.locator(':focus');
      const isVisible = await focusable.isVisible().catch(() => false);
      if (isVisible) {
        const tagName = await focusable.evaluate(el => el.tagName.toLowerCase());
        if (['button', 'a', 'input'].includes(tagName)) {
          break;
        }
      }
      tabCount++;
    }
    
    expect(tabCount).toBeLessThan(10);
  });
});
