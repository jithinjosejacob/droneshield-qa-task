
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: '../tests/apitests',
  reporter: [['html', { open: 'never' , outputFile : 'api-test-report.html'}]],
  use: {
    extraHTTPHeaders: {
      'Accept': '*/*'
    },
  }
});