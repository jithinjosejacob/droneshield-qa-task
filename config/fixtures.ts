import {test as base } from '@playwright/test';
import { LoginPage } from '../pageFactory/pageImplementation/LoginPage';
import { CartPage } from '../pageFactory/pageImplementation/CartPage';

type MyFixtures = {
  loginPage: LoginPage;
  cartPage: CartPage;
};

export const test = base.extend<{
    loginPage: LoginPage;
    cartPage: CartPage
  }>({
    loginPage: async ({ page }, use) => {
      await use(new LoginPage(page));
    },
    cartPage: async ({ page }, use) => {
      await use(new CartPage(page));
    },
});
export { expect } from '@playwright/test';