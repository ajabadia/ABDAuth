# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Identity Handshake (Login) >> should allow localization switching
- Location: tests\auth.spec.ts:25:7

# Error details

```
Error: locator.waitFor: Error: strict mode violation: locator('button:has-text("en")') resolved to 2 elements:
    1) <button aria-label="Idioma: EN" class="flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-all border bg-secondary/30 border-border hover:bg-secondary text-muted-foreground">en</button> aka getByRole('button', { name: 'Idioma: EN' })
    2) <button type="submit" aria-label="Autenticar Sistema" class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-lg border-b-2 border-blue-800 active:border-b-0 active:translate-y-[1px] transition-all flex items-center justify-center gap-2">…</button> aka getByRole('button', { name: 'Autenticar Sistema' })

Call log:
  - waiting for locator('button:has-text("en")') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - button "Open Settings" [active] [ref=e5]:
        - img [ref=e6]
      - generic [ref=e9]:
        - generic [ref=e10]:
          - generic [ref=e11]: Ajustes de Sistema
          - button "Cerrar" [ref=e12]:
            - img [ref=e13]
        - generic [ref=e16]:
          - generic [ref=e17]:
            - img [ref=e18]
            - text: Idioma
          - generic [ref=e22]:
            - 'button "Idioma: ES" [ref=e23]':
              - text: es
              - img [ref=e24]
            - 'button "Idioma: EN" [ref=e26]': en
        - generic [ref=e27]:
          - generic [ref=e28]:
            - img [ref=e29]
            - text: Tema
          - generic [ref=e31]:
            - 'button "Tema: Claro" [ref=e32]':
              - img [ref=e33]
              - generic [ref=e39]: Claro
            - 'button "Tema: Oscuro" [ref=e40]':
              - img [ref=e41]
              - generic [ref=e43]: Oscuro
              - img [ref=e44]
            - 'button "Tema: Sistema" [ref=e46]':
              - img [ref=e47]
              - generic [ref=e49]: Sistema
        - button "Iniciar Sesión" [ref=e51]:
          - img [ref=e52]
          - generic [ref=e55]: Iniciar Sesión
        - generic [ref=e56]: ABD_IDENTITY_V1.0
    - generic [ref=e57]:
      - button [ref=e58] [cursor=pointer]:
        - img [ref=e59]
      - heading "ABDAuth" [level=1] [ref=e61]
      - paragraph [ref=e62]: Gestor de Identidad Industrial
    - generic [ref=e63]:
      - generic [ref=e66]:
        - generic [ref=e67]:
          - text: Identity_Principal (Email)
          - generic [ref=e68]:
            - img [ref=e69]
            - textbox "usuario@ejemplo.com" [ref=e72]
        - generic [ref=e73]:
          - text: Auth_Secret (Contraseña)
          - generic [ref=e74]:
            - img [ref=e75]
            - textbox "••••••••" [ref=e78]
          - button "¿Olvidó su contraseña?" [ref=e80]
        - button "Autenticar Sistema" [ref=e81]:
          - img [ref=e82]
          - text: Autenticar Sistema
      - generic [ref=e86]: Certificado SOC2 Tipo II
    - generic [ref=e87]:
      - generic [ref=e88]: Credenciales de Laboratorio
      - generic [ref=e89]:
        - generic [ref=e90]: ajabadia@gmail.com
        - generic [ref=e91]: "11111111"
    - contentinfo [ref=e92]:
      - generic [ref=e93]:
        - img [ref=e94]
        - text: Sistema de Identidad Certificado v1.0
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e102] [cursor=pointer]:
    - img [ref=e103]
  - alert [ref=e106]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Identity Handshake (Login)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Start at login terminal
  6  |     await page.goto('/es/login');
  7  |   });
  8  | 
  9  |   test('should display login terminal with industrial branding', async ({ page }) => {
  10 |     await expect(page.locator('h1').first()).toContainText('ABDAuth');
  11 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  12 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should reject invalid credentials with industrial error', async ({ page }) => {
  16 |     await page.fill('input[type="email"]', 'intruder@evil.com');
  17 |     await page.fill('input[type="password"]', 'wrong-password');
  18 |     await page.click('button[type="submit"]');
  19 | 
  20 |     // Wait for industrial toast or error message
  21 |     const errorMsg = page.locator('text=Credenciales no autorizadas').first();
  22 |     await expect(errorMsg).toBeVisible();
  23 |   });
  24 | 
  25 |   test('should allow localization switching', async ({ page }) => {
  26 |     // Click settings button and wait for menu
  27 |     await page.click('button[aria-label="Open Settings"]');
  28 |     
  29 |     // Switch to English (Resilient selector: text matches the language code inside the button)
  30 |     const enButton = page.locator('button:has-text("en")');
> 31 |     await enButton.waitFor({ state: 'visible' });
     |                    ^ Error: locator.waitFor: Error: strict mode violation: locator('button:has-text("en")') resolved to 2 elements:
  32 |     await enButton.click();
  33 |     
  34 |     // Verify title change (Industrial Identity Gateway)
  35 |     // The subtitle text-muted-foreground is more unique than h1 brand
  36 |     await expect(page.locator('p.text-muted-foreground')).toContainText('Industrial Identity Gateway');
  37 |   });
  38 | });
  39 | 
```