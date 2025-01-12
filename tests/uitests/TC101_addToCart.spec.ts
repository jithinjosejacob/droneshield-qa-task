import { expect } from '@playwright/test';
import { test } from '../../config/fixtures';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateToSauceDashboard()
});

// Make sure that Sauce Labs Backpack can be added to the Cart Successfully.
test('Add to Cart test', async ({ cartPage, checkoutPage }) => {
    await cartPage.addProductToCart('Sauce Labs Backpack')
    const checkoutPageVisibility = await checkoutPage.verifyCheckoutPageVisibility()
    expect(checkoutPageVisibility).toBeTruthy()
});
