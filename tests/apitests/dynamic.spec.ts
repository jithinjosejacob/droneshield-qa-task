// API runner — turns every fetched API document into a Playwright test.
// Documents are pulled from MongoDB by `npm run fetch:api` just before this
// file is collected; here we only read the local cache synchronously.

import { test } from '@playwright/test';
import { loadGenerated } from '../../engine/loadGenerated';
import * as apiExecutor from '../../engine/apiExecutor';
import { ApiTestDoc } from '../../types/testSchema';

const { docs, error } = loadGenerated('api');

if (error) {
  test('dynamic API tests could not be loaded', () => {
    throw new Error(error);
  });
} else {
  for (const doc of docs as ApiTestDoc[]) {
    const title = doc.tags?.length ? `${doc.name} [${doc.tags.join(', ')}]` : doc.name;
    test(title, async ({ request }) => {
      await apiExecutor.run(request, doc);
    });
  }
}
