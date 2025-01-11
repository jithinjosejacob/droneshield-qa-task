import { test, expect } from '@playwright/test';

test('should create an api test request', async ({ request }) => {
  const responseStatus = await request.get(`http://petstore.swagger.io/v2/pet/findByStatus?status=available`)
  expect(responseStatus.ok()).toBeTruthy();
})