import { test, expect } from '@playwright/test';

test.describe('Identity Handshake (Login)', () => {
  test.beforeEach(async ({ page }) => {
    // Start at login terminal
    await page.goto('/es/login');
  });

  test('should display login terminal with industrial branding', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('ABDAuth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should reject invalid credentials with industrial error', async ({ page }) => {
    await page.fill('input[type="email"]', 'intruder@evil.com');
    await page.fill('input[type="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    // Wait for industrial toast or error message
    const errorMsg = page.locator('text=Credenciales no autorizadas').first();
    await expect(errorMsg).toBeVisible();
  });

  test('should allow localization switching', async ({ page }) => {
    // Click settings button and wait for menu
    await page.click('button[aria-label="Open Settings"]');
    
    // Switch to English (Resilient selector: text matches the language code inside the button)
    const enButton = page.locator('button:has-text("en")');
    await enButton.waitFor({ state: 'visible' });
    await enButton.click();
    
    // Verify title change (Industrial Identity Gateway)
    // The subtitle text-muted-foreground is more unique than h1 brand
    await expect(page.locator('p.text-muted-foreground')).toContainText('Industrial Identity Gateway');
  });
});
