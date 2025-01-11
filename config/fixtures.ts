import {test as base } from '@playwright/test';
import { LoginPage } from '../pageFactory/LoginPage';
import { CartPage } from '../pageFactory/CartPage';
import { CheckoutPage } from 'pageFactory/CheckoutPage';

type MyFixtures = {
  loginPage: LoginPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<{
    loginPage: LoginPage;
    cartPage: CartPage
    checkoutPage: CheckoutPage;
  }>({
    loginPage: async ({ page }, use) => {
      await use(new LoginPage(page));
    },
    cartPage: async ({ page }, use) => {
      await use(new CartPage(page));
    },
    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
    },
});
export { expect } from '@playwright/test';