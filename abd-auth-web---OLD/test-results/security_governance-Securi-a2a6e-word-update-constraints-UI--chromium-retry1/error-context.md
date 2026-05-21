# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security_governance.spec.ts >> Security Governance >> should validate password update constraints (UI)
- Location: tests\security_governance.spec.ts:41:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 120000ms exceeded.
=========================== logs ===========================
waiting for navigation until "domcontentloaded"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "Open Settings" [ref=e5]:
      - img [ref=e6]
    - generic [ref=e9]:
      - button [ref=e10] [cursor=pointer]:
        - img [ref=e11]
      - heading "ABDAuth" [level=1] [ref=e13]
      - paragraph [ref=e14]: Gestor de Identidad Industrial
    - generic [ref=e15]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - text: Identity_Principal (Email)
          - generic [ref=e20]:
            - img [ref=e21]
            - textbox "usuario@ejemplo.com" [ref=e24]: ajabadia@gmail.com
        - generic [ref=e25]:
          - text: Auth_Secret (Contraseña)
          - generic [ref=e26]:
            - img [ref=e27]
            - textbox "••••••••" [ref=e30]: "11111111"
          - button "¿Olvidó su contraseña?" [ref=e32]
        - generic [ref=e33]:
          - img [ref=e34]
          - paragraph [ref=e36]: Credenciales no autorizadas
        - button "Autenticar Sistema" [ref=e37]:
          - img [ref=e38]
          - text: Autenticar Sistema
      - generic [ref=e42]: Certificado SOC2 Tipo II
    - generic [ref=e43]:
      - generic [ref=e44]: Credenciales de Laboratorio
      - generic [ref=e45]:
        - generic [ref=e46]: ajabadia@gmail.com
        - generic [ref=e47]: "11111111"
    - contentinfo [ref=e48]:
      - generic [ref=e49]:
        - img [ref=e50]
        - text: Sistema de Identidad Certificado v1.0
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e58] [cursor=pointer]:
    - img [ref=e59]
  - alert [ref=e62]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * 🔐 Security Governance & Identity Restoration
  5  |  * Validates self-service security flows.
  6  |  */
  7  | test.describe('Security Governance', () => {
  8  | 
  9  |   test('should allow requesting a password restoration link', async ({ page }) => {
  10 |     await page.goto('/es/login');
  11 |     await page.click('button:has-text("¿Olvidó su contraseña?")');
  12 |     
  13 |     await expect(page).toHaveURL(/\/forgot-password/);
  14 |     await expect(page.locator('h1')).toContainText('Recuperar Acceso');
  15 |     
  16 |     await page.fill('input[type="email"]', 'ajabadia@gmail.com');
  17 |     await page.click('button[type="submit"]');
  18 |     
  19 |     // Success message check (using .first() to avoid toast duplication)
  20 |     await expect(page.locator('text=Si el sistema reconoce la identidad').first()).toBeVisible();
  21 |   });
  22 | 
  23 |   test('should display active sessions in the governance portal', async ({ page }) => {
  24 |     // 🔐 Admin Login
  25 |     await page.goto('/es/login');
  26 |     await page.fill('input[type="email"]', 'ajabadia@gmail.com');
  27 |     await page.fill('input[type="password"]', '11111111');
  28 |     await page.click('button[type="submit"]');
  29 |     await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
  30 |     
  31 |     await page.goto('/es/dashboard/security');
  32 |     
  33 |     // Security Page Title is H1 (target main content specifically)
  34 |     await expect(page.locator('main h1')).toContainText('Gobernanza de Seguridad');
  35 |     
  36 |     // Check for session list
  37 |     await expect(page.locator('text=Sesiones Activas').first()).toBeVisible();
  38 |     await expect(page.locator('text=Sesión Actual').first()).toBeVisible();
  39 |   });
  40 | 
  41 |   test('should validate password update constraints (UI)', async ({ page }) => {
  42 |     await page.goto('/es/login');
  43 |     await page.fill('input[type="email"]', 'ajabadia@gmail.com');
  44 |     await page.fill('input[type="password"]', '11111111');
  45 |     await page.click('button[type="submit"]');
> 46 |     await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.waitForURL: Test timeout of 120000ms exceeded.
  47 |     
  48 |     await page.goto('/es/dashboard/security');
  49 |     
  50 |     // Fill different passwords - targeting by placeholder specifically
  51 |     const inputs = page.locator('input[placeholder="••••••••"]');
  52 |     await inputs.nth(0).fill('short');
  53 |     await inputs.nth(1).fill('different');
  54 |     
  55 |     const updateBtn = page.locator('button:has-text("Actualizar Contraseña")');
  56 |     await updateBtn.waitFor({ state: 'visible' });
  57 |     await updateBtn.click();
  58 |     
  59 |     // Check for validation (Sonner toast or error message)
  60 |     await expect(page.locator('text=mínimo 8 caracteres').first()).toBeVisible();
  61 |   });
  62 | 
  63 |   test('should trigger MFA setup flow and display QR section', async ({ page }) => {
  64 |     await page.goto('/es/login');
  65 |     await page.fill('input[type="email"]', 'ajabadia@gmail.com');
  66 |     await page.fill('input[type="password"]', '11111111');
  67 |     await page.click('button[type="submit"]');
  68 |     await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
  69 |     
  70 |     await page.goto('/es/dashboard/security');
  71 |     
  72 |     // Trigger MFA setup
  73 |     const mfaBtn = page.locator('button:has-text("Activar 2FA")');
  74 |     await mfaBtn.waitFor({ state: 'visible', timeout: 10000 });
  75 |     await mfaBtn.click();
  76 |     
  77 |     // Verify QR section appears
  78 |     await expect(page.locator('text=Escanee este código QR').first()).toBeVisible();
  79 |     await expect(page.locator('img[alt="QR Code"]').first()).toBeVisible();
  80 |   });
  81 | });
  82 | 
```