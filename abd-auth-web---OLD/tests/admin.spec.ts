import { test, expect } from '@playwright/test';

/**
 * 🏢 Administrative Governance Tests
 * Validates user management and satellite orchestration.
 */
test.describe('Administrative Governance', () => {
  
  test.beforeEach(async ({ page }) => {
    // 🔐 Perform Admin Login
    // Note: In a real scenario, we should use a storage state or a test admin user
    await page.goto('/es/login');
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.fill('input[type="password"]', '11111111');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard redirection and hydration (domcontentloaded is faster in dev)
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should navigate to User Management and show records', async ({ page }) => {
    await page.goto('/es/dashboard/users');
    
    // Explicit wait for the header to avoid race conditions
    const header = page.locator('h2');
    await header.waitFor({ state: 'visible' });
    await expect(header).toContainText('Identidades');
    
    // Check if at least one user card is visible
    const userCards = page.locator('.bg-card').first();
    await expect(userCards).toBeVisible();
  });

  test('should open User Creation modal and be scrollable', async ({ page }) => {
    await page.goto('/es/dashboard/users');
    
    // Click Add User button
    await page.click('button[aria-label="Nuevo Usuario"]');
    
    // Verify Modal visibility
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check for the newly implemented scrollable container
    const scrollContainer = modal.locator('.overflow-y-auto');
    await expect(scrollContainer).toBeVisible();
  });

  test('should navigate to Application (Satellites) Management', async ({ page }) => {
    await page.goto('/es/dashboard/applications');
    
    await expect(page.locator('h2')).toContainText('Ecosistema de Satélites');
    
    // Verify application cards exist
    const appCards = page.locator('.bg-card');
    await expect(appCards.first()).toBeVisible();
  });
});
