import { expect } from '@playwright/test';
import { test } from '../../config/fixtures';

test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigateToSauceDashboard()
});

test('Add to Cart test', async ({ cartPage, checkoutPage }) => {
    await cartPage.addProductToCart('Sauce Labs Backpack')
    const checkoutPageVisibility = await checkoutPage.verifyCheckoutPageVisibility()
    expect(checkoutPageVisibility).toBeTruthy()
});
