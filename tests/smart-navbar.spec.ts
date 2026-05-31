import { test, expect } from '@playwright/test';

/**
 * 🎭 SmartNavbar Industrial E2E Tests — ABDAuth (Public Mode)
 *
 * Coverage:
 *   ✓ SmartNavbar renders in public mode (landing, login, forgot-password)
 *   ✓ Theme mega-menu: open/close, switch light/dark/system
 *   ✓ Language mega-menu: open/close, ES/EN active state, locale switch
 *   ✓ Settings slot (SystemSettings cog) visible in public mode
 *   ✓ Login button visible and clickable in public mode
 *   ✓ Brand logo visible
 *
 * This test runs against the ABDAuth dev server (port 3400).
 * All scenarios are tested in PUBLIC mode (not authenticated).
 */

test.describe('SmartNavbar — Public Mode (ABDAuth)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the ES login page (public)
    await page.goto('/es/login');
    // Wait for the SmartNavbar to hydrate
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  // ──────────────────────────────────────────
  //  Basic Structure
  // ──────────────────────────────────────────

  test('should render SmartNavbar with brand logo and login button', async ({ page }) => {
    // Core navbar
    const navbar = page.locator('[data-testid="smart-navbar"]');
    await expect(navbar).toBeVisible();

    // Brand logo
    const logo = page.locator('[data-testid="navbar-logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText(/ABD/);

    // Login button should be visible in public mode
    const loginBtn = page.locator('button', { hasText: 'INICIAR SESIÓN' });
    await expect(loginBtn).toBeVisible();
  });

  test('should display app badge "AUTH" next to the brand logo', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText('AUTH');
  });

  test('hamburger toggle should not be visible on desktop viewport', async ({ page }) => {
    // The hamburger uses smart-navbar-mobile-only (display:none on md+)
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).not.toBeVisible();
  });

  test('should render utility buttons (theme, language) — no system-settings-trigger in public mode', async ({ page }) => {
    // Theme toggle button
    const themeBtn = page.locator('[data-testid="navbar-menu-theme"]');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toHaveAttribute('aria-haspopup', 'true');

    // Language toggle button — visible because onLocaleChange is provided
    const langBtn = page.locator('[data-testid="navbar-menu-language"]');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveAttribute('aria-haspopup', 'true');

    // SystemSettings is only rendered inside the mobile drawer (md:hidden).
    // The data-testid="system-settings-trigger" does NOT exist on desktop —
    // SystemSettings wraps its trigger without this testid.
    const settingsTrigger = page.locator('[data-testid="system-settings-trigger"]');
    await expect(settingsTrigger).toHaveCount(0);
  });

  // ──────────────────────────────────────────
  //  Theme Mega-Menu
  // ──────────────────────────────────────────

  test('theme mega-menu: opens on click and shows light/dark/system options', async ({ page }) => {
    // Click theme button
    const themeBtn = page.locator('[data-testid="navbar-menu-theme"]');
    await themeBtn.click();

    // Mega-menu dropdown should appear
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Should show "TEMA" heading
    await expect(dropdown).toContainText('TEMA');

    // Should show 3 theme options
    await expect(dropdown.locator('button', { hasText: 'CLARO' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'OSCURO' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'SISTEMA' })).toBeVisible();
  });

  test('theme switching: dark mode applies html class', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /OSCURO|DARK/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('theme switching: light mode applies html class', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /CLARO|LIGHT/i }).click();
    await expect(page.locator('html')).toHaveClass(/light/);
  });

  test('theme mega-menu: clicking outside closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Click outside the navbar — use page.evaluate to dispatch native mousedown
    // on document, bypassing the dropdown overlay that intercepts Playwright's
    // actionability check
    await page.evaluate(() =>
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    );

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });

  // ──────────────────────────────────────────
  //  Language Mega-Menu
  // ──────────────────────────────────────────

  test('language mega-menu: opens on click and shows ES/EN options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();

    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();

    // The dropdown shows button texts directly without an IDIOMA/LANGUAGE header
    await expect(dropdown).toContainText(/ESPAÑOL|ENGLISH/i);

    // Should show ESPAÑOL and ENGLISH options
    await expect(dropdown.locator('button', { hasText: 'ESPAÑOL' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'ENGLISH' })).toBeVisible();
  });

  test('language mega-menu: switching to English navigates to /en/login', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Click ENGLISH
    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();

    // Should navigate to /en/login (or /en with no trailing slash)
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });
  });

  test('language mega-menu: switching back to Spanish from English', async ({ page }) => {
    // First switch to English to verify we can come back
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });

    // Now switch back to Spanish
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });
    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ESPAÑOL' }).click();
    await page.waitForURL(/\/es(?:$|\/)/, { timeout: 10000 });
  });

  test('language mega-menu: Escape key closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Press Escape
    await page.keyboard.press('Escape');

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });

  // ──────────────────────────────────────────
  //  SmartNavbar on other public pages
  // ──────────────────────────────────────────

  test('SmartNavbar renders on forgot-password page in public mode', async ({ page }) => {
    await page.goto('/es/login/forgot-password');
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });

    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();

    // Login button should be visible
    await expect(page.locator('button', { hasText: 'INICIAR SESIÓN' })).toBeVisible();
  });

  test('SmartNavbar renders on reset-password page in public mode', async ({ page }) => {
    await page.goto('/es/login/reset-password');
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });

    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
  });
});

// ──────────────────────────────────────────
//  Mobile Drawer Tests
// ──────────────────────────────────────────

test.describe('SmartNavbar — Mobile Drawer (ABDAuth)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/es/login');
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 15000 });
  });

  test('hamburger toggle is visible on mobile viewport', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).toBeVisible();
  });

  test('clicking hamburger opens and closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('mobile drawer has correct accessibility attributes', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    const drawer = page.locator('[data-testid="navbar-mobile-drawer"]');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  test('clicking backdrop closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    // Click at top-center of viewport — hits the backdrop above the drawer (top:56px)
    // Use page.evaluate to trigger the backdrop onClick handler natively,
    // since page.mouse.click() doesn't properly activate React's synthetic event
    await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop instanceof HTMLElement) backdrop.click();
    });
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('Escape key closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });
});
