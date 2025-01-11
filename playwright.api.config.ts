
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apitests',
  reporter: 'html',
  use: {
    extraHTTPHeaders: {
      'Accept': '*/*'
    },
  }
});