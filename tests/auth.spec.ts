import { test, expect } from '@playwright/test';

test.describe('Identity Handshake (Login)', () => {
  test.beforeEach(async ({ page }) => {
    // Start at login terminal
    await page.goto('/es/login');
    // Wait for SmartNavbar to hydrate before interacting with it
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('should display login terminal with industrial branding', async ({ page }) => {
    await expect(page.locator('h1').first()).toContainText('ABD Auth');
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

  test('should allow localization switching via language mega-menu', async ({ page }) => {
    // SystemSettings is only rendered in the mobile drawer (md:hidden), not on desktop.
    // Instead, use the language mega-menu button which is always visible on desktop.
    await page.locator('[data-testid="navbar-menu-language"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Click ENGLISH button
    await dropdown.locator('button', { hasText: 'ENGLISH' }).click();

    // Should navigate to /en/login
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });

    // Verify English content is shown (Industrial Identity Gateway subtitle)
    await expect(page.locator('p.text-muted-foreground')).toContainText('Industrial Identity Gateway');
  });
});
