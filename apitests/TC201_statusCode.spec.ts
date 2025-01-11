import { test, expect } from '@playwright/test';

test('should create an api test request', async ({ request }) => {
  const responseStatus = await request.get(`${process.env.API_URL}/pet/findByStatus?status=available`)
  expect(responseStatus.ok()).toBeTruthy();
})