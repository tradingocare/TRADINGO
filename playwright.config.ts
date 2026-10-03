import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // NOTE (CI-06): no extraHTTPHeaders. The API CORS policy does not
    // allowlist custom headers, so any extra header forces a preflight the
    // API cannot satisfy and the browser blocks every CORS API call.
    // The previous 'x-playwright-test' marker was read by nothing
    // (verified: zero references in apps/ and tests/) and silently broke
    // all browser-side API data loading. Do not re-add custom headers here
    // unless the API CORS allowlist is updated first.
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: [
            '--use-fake-device-for-media-stream',
            '--use-fake-ui-for-media-stream',
            '--allow-geolocation',
          ],
        },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],

  globalSetup: require.resolve('./tests/helpers/global-setup'),
  globalTeardown: require.resolve('./tests/helpers/global-teardown'),
});
