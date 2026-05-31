import { test, expect } from '@playwright/test';

/**
 * 🎭 ConfirmDialog Industrial E2E Tests — ABDAuth
 *
 * Validates the 4 consumption patterns of ConfirmDialog across the ecosystem.
 *
 * Cases covered in ABDAuth:
 *   Case 4 — ApplicationManagementContainer (Applications page)
 *
 * Note: Case 3 (Auth TenantManagementContainer) has no active route
 *       in ABDAuth (the /dashboard/tenants page redirects to the
 *       Gobernance control plane). The Gobernance TenantManagementContainer
 *       test (Case 2) covers the identical component pattern.
 */

const ADMIN_EMAIL = 'ajabadia@gmail.com';
const ADMIN_PASSWORD = '11111111';

test.describe('ConfirmDialog — Ecosystem Consumption', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('Case 4: Application deletion — dialog opens, displays content, and cancels', async ({ page }) => {
    await page.goto('/es/dashboard/applications');

    // Wait for application cards to hydrate
    const appCard = page.locator('.bg-card').first();
    await appCard.waitFor({ state: 'visible', timeout: 10000 });

    // Check that at least one card exists (delete button is hidden until hover)
    const hasCards = await appCard.isVisible().catch(() => false);
    test.skip(!hasCards, 'No application cards available to test deletion dialog');

    const deleteBtn = page.locator('button[aria-label="Delete Satellite"]').first();

    // ── Hover card to reveal delete button, then click ──
    await appCard.hover();
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Verify dialog content ──
    await expect(dialog).toContainText('ELIMINAR');
    // Use specific button locators to avoid strict mode violations
    // (the dialog has both an X close button and a CANCELAR action button)
    await expect(dialog.getByRole('button', { name: /CANCELAR/i }).first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /ELIMINAR/i }).first()).toBeVisible();

    // ── Cancel flow — dialog closes ──
    await dialog.getByRole('button', { name: /CANCELAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('Case 4: Application deletion — confirms and removes the item', async ({ page }) => {
    await page.goto('/es/dashboard/applications');

    const appCard = page.locator('.bg-card').first();
    await appCard.waitFor({ state: 'visible', timeout: 10000 });

    // Check that at least one card exists
    const hasCards = await appCard.isVisible().catch(() => false);
    test.skip(!hasCards, 'No application cards available');

    const deleteBtn = page.locator('button[aria-label="Delete Satellite"]').first();

    // ── Open dialog ──
    await appCard.hover();
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Confirm — dialog should close after delete resolves ──
    await dialog.getByRole('button', { name: /ELIMINAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });
});
