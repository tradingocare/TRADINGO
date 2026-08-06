import { Page, expect } from '@playwright/test';
import { loginAs, TestUser } from './auth';

export interface BusinessFlowResult {
  step: string;
  status: 'pass' | 'fail';
  detail?: string;
}

export class BusinessFlowHelper {
  constructor(private readonly page: Page) {}

  async login(user: TestUser): Promise<void> {
    await loginAs(this.page, user);
  }

  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('load');
  }

  async fillField(selector: string, value: string): Promise<void> {
    const input = this.page.locator(selector).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(value);
  }

  async clickButton(text: string): Promise<void> {
    const btn = this.page.locator(`button:has-text("${text}")`).first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
  }

  async clickLink(text: string): Promise<void> {
    const link = this.page.locator(`a:has-text("${text}")`).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.click();
  }

  async selectOption(selector: string, value: string): Promise<void> {
    const select = this.page.locator(selector).first();
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.selectOption(value);
  }

  async expectVisible(text: string, timeout = 10000): Promise<void> {
    await expect(this.page.locator(`text="${text}"`).first()).toBeVisible({ timeout });
  }

  async expectUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern, { timeout: 15000 });
  }

  async expectHeading(text: string): Promise<void> {
    await expect(this.page.locator('h1').first()).toContainText(text, { timeout: 10000 });
  }

  async waitForSettled(): Promise<void> {
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('load');
  }
}

export function createFlowHelper(page: Page): BusinessFlowHelper {
  return new BusinessFlowHelper(page);
}
