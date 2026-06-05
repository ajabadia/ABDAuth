import { defineConfig, devices } from '@playwright/test';

/**
 * 🎭 Playwright Industrial Configuration
 * Optimized for Next.js 16 and zero-noise identity testing.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // 🛡️ Sequence execution for industrial stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 🔄 Allow one retry for race conditions
  workers: 1, // 🏢 Single worker to reduce load on dev server
  reporter: 'html',
  timeout: 120000, // 🛡️ Industrial 2-minute timeout per test
  use: {
    baseURL: 'http://localhost:5001',
    trace: 'on-first-retry',
    screenshot: 'on', // 📸 Always capture screenshots for industrial auditing
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 🚀 Auto-start server for tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5001',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
