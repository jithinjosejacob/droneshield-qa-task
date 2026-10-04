// Generic UI step interpreter.
// Dispatches a fixed set of actions against a Playwright Page. There is no
// eval and no dynamic code — only the actions enumerated in UiStep are honoured.

import { Page, expect } from '@playwright/test';
import { UiStep } from '../types/testSchema';
import { resolve } from './resolve';

export async function run(page: Page, steps: UiStep[]): Promise<void> {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error('UI test has no steps.');
  }

  for (let index = 0; index < steps.length; index++) {
    await runStep(page, steps[index], index);
  }
}

async function runStep(page: Page, step: UiStep, index: number): Promise<void> {
  switch (step.action) {
    case 'goto':
      await page.goto(resolve(step.target));
      return;
    case 'fill':
      await page.locator(step.selector).fill(resolve(step.value));
      return;
    case 'type':
      await page.locator(step.selector).pressSequentially(resolve(step.value));
      return;
    case 'click':
      await page.locator(step.selector).click();
      return;
    case 'check':
      await page.locator(step.selector).check();
      return;
    case 'selectOption':
      await page.locator(step.selector).selectOption(resolve(step.value));
      return;
    case 'press':
      await page.locator(step.selector).press(step.key);
      return;
    case 'waitFor':
      if (step.selector) {
        await page.locator(step.selector).waitFor();
      } else {
        await page.waitForTimeout(step.timeout ?? 1000);
      }
      return;
    case 'expectVisible':
      await expect(page.locator(step.selector)).toBeVisible();
      return;
    case 'expectHidden':
      await expect(page.locator(step.selector)).toBeHidden();
      return;
    case 'expectText':
      await expect(page.locator(step.selector)).toHaveText(resolve(step.value));
      return;
    case 'expectUrl':
      await expect(page).toHaveURL(resolve(step.value));
      return;
    default: {
      // Exhaustiveness guard: an unknown action is a hard, explicit failure.
      const unknown = step as { action?: string };
      throw new Error(
        `Unsupported UI action "${unknown.action}" at step ${index}.`
      );
    }
  }
}
