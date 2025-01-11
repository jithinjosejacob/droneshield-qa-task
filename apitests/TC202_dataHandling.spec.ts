import { test, expect } from '@playwright/test';

test.beforeAll(async ({ request }) => {
  // Create required test data using api here
  // If there is any test data required globally, using globalsetup as well
});

test.skip('should create an api test request', async ({ request }) => {
  const responseStatus = await request.get(`http://petstore.swagger.io/v2/pet/findByStatus?status=available`)
  expect(responseStatus.ok()).toBeTruthy();
})


test.afterAll(async ({ request }) => {
  // Delete required test data using api here
});