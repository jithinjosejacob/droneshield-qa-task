// UI runner — turns every fetched UI document into a Playwright test.
// The documents were pulled from MongoDB by `npm run fetch:ui` just before
// this file was collected; here we only read the local cache synchronously.

import { test } from '@playwright/test';
import { loadGenerated } from '../../engine/loadGenerated';
import * as uiExecutor from '../../engine/uiExecutor';
import { UiTestDoc } from '../../types/testSchema';

const { docs, error } = loadGenerated('ui');

if (error) {
  // Make the misconfiguration loud instead of silently passing with 0 tests.
  test('dynamic UI tests could not be loaded', () => {
    throw new Error(error);
  });
} else {
  for (const doc of docs as UiTestDoc[]) {
    const title = doc.tags?.length ? `${doc.name} [${doc.tags.join(', ')}]` : doc.name;
    test(title, async ({ page }) => {
      await uiExecutor.run(page, doc.steps);
    });
  }
}
