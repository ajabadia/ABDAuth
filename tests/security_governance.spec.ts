import { test, expect } from '@playwright/test';

/**
 * 🔐 Security Governance & Identity Restoration
 * Validates self-service security flows.
 */
test.describe('Security Governance', () => {

  test('should allow requesting a password restoration link', async ({ page }) => {
    await page.goto('/es/login');
    await page.click('button:has-text("¿Olvidó su contraseña?")');
    
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.locator('h1')).toContainText('Recuperar Acceso');
    
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.click('button[type="submit"]');
    
    // Success message check (using .first() to avoid toast duplication)
    await expect(page.locator('text=Si el sistema reconoce la identidad').first()).toBeVisible();
  });

  test('should display active sessions in the governance portal', async ({ page }) => {
    // 🔐 Admin Login
    await page.goto('/es/login');
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.fill('input[type="password"]', '11111111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
    
    await page.goto('/es/dashboard/security');
    
    // Security Page Title is H1 (target main content specifically)
    await expect(page.locator('main h1')).toContainText('Gobernanza de Seguridad');
    
    // Check for session list
    await expect(page.locator('text=Sesiones Activas').first()).toBeVisible();
    await expect(page.locator('text=Sesión Actual').first()).toBeVisible();
  });

  test('should validate password update constraints (UI)', async ({ page }) => {
    await page.goto('/es/login');
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.fill('input[type="password"]', '11111111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
    
    await page.goto('/es/dashboard/security');
    
    // Fill different passwords - targeting by placeholder specifically
    const inputs = page.locator('input[placeholder="••••••••"]');
    await inputs.nth(0).fill('short');
    await inputs.nth(1).fill('different');
    
    const updateBtn = page.locator('button:has-text("Actualizar Contraseña")');
    await updateBtn.waitFor({ state: 'visible' });
    await updateBtn.click();
    
    // Check for validation (Sonner toast or error message)
    await expect(page.locator('text=mínimo 8 caracteres').first()).toBeVisible();
  });

  test('should trigger MFA setup flow and display QR section', async ({ page }) => {
    await page.goto('/es/login');
    await page.fill('input[type="email"]', 'ajabadia@gmail.com');
    await page.fill('input[type="password"]', '11111111');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
    
    await page.goto('/es/dashboard/security');
    
    // Trigger MFA setup
    const mfaBtn = page.locator('button:has-text("Activar 2FA")');
    await mfaBtn.waitFor({ state: 'visible', timeout: 10000 });
    await mfaBtn.click();
    
    // Verify QR section appears
    await expect(page.locator('text=Escanee este código QR').first()).toBeVisible();
    await expect(page.locator('img[alt="QR Code"]').first()).toBeVisible();
  });
});
