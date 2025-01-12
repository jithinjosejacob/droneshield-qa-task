import { test, expect } from '@playwright/test';

// Pets whose status is available return 200 on successful response.
test('should create an api test request', async ({ request }) => {
  const responseStatus = await request.get(`${process.env.API_URL}/pet/findByStatus?status=available`)
  expect(responseStatus.ok()).toBeTruthy();
})