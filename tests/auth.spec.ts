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

test.describe('Authenticated Session Flows (@smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es/login');
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.fill('input[type="password"]', '11111111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
  });

  test('@smoke:4 should complete logout flow via user menu', async ({ page }) => {
    const userMenuBtn = page.locator('[data-testid="navbar-menu-user"]');
    await userMenuBtn.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuBtn.click();

    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    await dropdown.locator('button', { hasText: 'TERMINAR SESIÓN' }).click();
    await page.waitForURL(url => !url.pathname.includes('/dashboard'), { timeout: 15000 });
    const loginBtn = page.locator('button', { hasText: 'INICIAR SESIÓN' });
    await expect(loginBtn).toBeVisible({ timeout: 10000 });
  });

  test('@smoke:3 should perform SSO handshake and redirect with auth code', async ({ page }) => {
    const ssoUrl = '/api/auth/sso?appId=quiz&tenantId=ascensores-pro&redirectUri=http://localhost:5020';

    const redirectRequest = page.waitForRequest(
      req => req.url().startsWith('http://localhost:5020'),
      { timeout: 10000 }
    );
    await page.goto(ssoUrl).catch(() => {});
    const req = await redirectRequest;

    expect(req.url()).toMatch(/^http:\/\/localhost:5020\/\?code=[a-f0-9]+&state=%2F&sso_retry=1$/);
  });
});
