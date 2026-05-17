# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Administrative Governance >> should navigate to User Management and show records
- Location: tests\admin.spec.ts:22:7

# Error details

```
Test timeout of 120000ms exceeded while running "beforeEach" hook.
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
  4  |  * 🏢 Administrative Governance Tests
  5  |  * Validates user management and satellite orchestration.
  6  |  */
  7  | test.describe('Administrative Governance', () => {
  8  |   
  9  |   test.beforeEach(async ({ page }) => {
  10 |     // 🔐 Perform Admin Login
  11 |     // Note: In a real scenario, we should use a storage state or a test admin user
  12 |     await page.goto('/es/login');
  13 |     await page.fill('input[type="email"]', 'ajabadia@gmail.com');
  14 |     await page.fill('input[type="password"]', '11111111');
  15 |     await page.click('button[type="submit"]');
  16 |     
  17 |     // Wait for dashboard redirection and hydration (domcontentloaded is faster in dev)
> 18 |     await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.waitForURL: Test timeout of 120000ms exceeded.
  19 |     await expect(page.locator('h1').first()).toBeVisible();
  20 |   });
  21 | 
  22 |   test('should navigate to User Management and show records', async ({ page }) => {
  23 |     await page.goto('/es/dashboard/users');
  24 |     
  25 |     // Explicit wait for the header to avoid race conditions
  26 |     const header = page.locator('h2');
  27 |     await header.waitFor({ state: 'visible' });
  28 |     await expect(header).toContainText('Identidades');
  29 |     
  30 |     // Check if at least one user card is visible
  31 |     const userCards = page.locator('.bg-card').first();
  32 |     await expect(userCards).toBeVisible();
  33 |   });
  34 | 
  35 |   test('should open User Creation modal and be scrollable', async ({ page }) => {
  36 |     await page.goto('/es/dashboard/users');
  37 |     
  38 |     // Click Add User button
  39 |     await page.click('button[aria-label="Nuevo Usuario"]');
  40 |     
  41 |     // Verify Modal visibility
  42 |     const modal = page.locator('div[role="dialog"]');
  43 |     await expect(modal).toBeVisible();
  44 |     
  45 |     // Check for the newly implemented scrollable container
  46 |     const scrollContainer = modal.locator('.overflow-y-auto');
  47 |     await expect(scrollContainer).toBeVisible();
  48 |   });
  49 | 
  50 |   test('should navigate to Application (Satellites) Management', async ({ page }) => {
  51 |     await page.goto('/es/dashboard/applications');
  52 |     
  53 |     await expect(page.locator('h2')).toContainText('Ecosistema de Satélites');
  54 |     
  55 |     // Verify application cards exist
  56 |     const appCards = page.locator('.bg-card');
  57 |     await expect(appCards.first()).toBeVisible();
  58 |   });
  59 | });
  60 | 
```