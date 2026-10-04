
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: '../tests/apitests',
  /* Only the DB-driven runner executes; legacy TC-specs remain for reference. */
  testMatch: '**/dynamic.spec.ts',
  reporter: [['html', { open: 'never' , outputFile : 'api-test-report.html'}]],
  use: {
    extraHTTPHeaders: {
      'Accept': '*/*'
    },
  }
});