import { test as base } from '@playwright/test';
import { loginAs, logout, BUYER_USER, SELLER_USER, ADMIN_USER, type TestUser } from '../helpers/auth';

type AuthFixtures = {
  buyerPage: any;
  sellerPage: any;
  adminPage: any;
  authenticatedPage: (user: TestUser) => Promise<any>;
};

export const test = base.extend<AuthFixtures>({
  buyerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, BUYER_USER);
    await use(page);
    await context.close();
  },

  sellerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, SELLER_USER);
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, ADMIN_USER);
    await use(page);
    await context.close();
  },

  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use(async (user: TestUser) => {
      await loginAs(page, user);
      return page;
    });
    await context.close();
  },
});

export { expect } from '@playwright/test';
