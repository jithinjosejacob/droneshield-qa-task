import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Combined config: runs every suite in a single Playwright run so all test
 * cases land in ONE HTML report. Projects:
 *   - api / ui             -> dynamic, DB-driven runners (dynamic.spec.ts)
 *   - api-legacy / ui-legacy -> the original static specs (TC*.spec.ts)
 *
 * The dynamic runners read the .generated/*.tests.json caches, so run the fetch
 * steps first (npm run test:all does this for you).
 */
export default defineConfig({
  globalSetup: './global-setup.ui.ts',
  reportSlowTests: null,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testDir: '../tests/apitests',
      testMatch: '**/dynamic.spec.ts',
      use: {
        extraHTTPHeaders: { Accept: '*/*' },
      },
    },
    {
      name: 'ui',
      testDir: '../tests/uitests',
      testMatch: '**/dynamic.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : false,
        launchOptions: { slowMo: 1000 },
      },
    },
    {
      name: 'api-legacy',
      testDir: '../tests/apitests',
      testMatch: '**/TC*.spec.ts',
      use: {
        extraHTTPHeaders: { Accept: '*/*' },
      },
    },
    {
      name: 'ui-legacy',
      testDir: '../tests/uitests',
      testMatch: '**/TC*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : false,
        launchOptions: { slowMo: 1000 },
      },
    },
  ],
});
