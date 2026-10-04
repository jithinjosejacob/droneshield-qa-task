// Seed helper — populates the external MongoDB with the two tests that used to
// live as static specs (TC101 add-to-cart, TC201 pets-available). Behaviour is
// preserved; the tests are now data rather than code.
//
// Idempotent: upserts by `name`. Run with `npm run seed`.

import { getCollectionName, getDb, closeClient } from '../db/mongoClient';
import { TestDoc } from '../types/testSchema';

const SEED_TESTS: TestDoc[] = [
  {
    type: 'ui',
    name: 'Add Sauce Labs Backpack to cart',
    enabled: true,
    tags: ['smoke', 'cart'],
    steps: [
      { action: 'goto', target: 'env:BASE_URL' },
      { action: 'fill', selector: '#user-name', value: 'env:SAUCEDEMO_USERNAME' },
      { action: 'fill', selector: '#password', value: 'env:SAUCEDEMO_PASSWORD' },
      { action: 'click', selector: '#login-button' },
      { action: 'click', selector: '#add-to-cart-sauce-labs-backpack' },
      { action: 'click', selector: '[data-test="shopping-cart-link"]' },
      { action: 'expectVisible', selector: '[data-test="checkout"]' },
    ],
  },
  {
    type: 'api',
    name: 'Available pets return 200',
    enabled: true,
    tags: ['smoke'],
    request: {
      method: 'get',
      url: 'env:API_URL/pet/findByStatus?status=available',
    },
    assertions: [{ type: 'expectOk' }],
  },
];

async function main(): Promise<void> {
  const db = await getDb();
  const collection = db.collection(getCollectionName());

  for (const doc of SEED_TESTS) {
    await collection.updateOne(
      { name: doc.name },
      { $set: doc },
      { upsert: true }
    );
    console.log(`Upserted: [${doc.type}] ${doc.name}`);
  }
  console.log(`\nSeeded ${SEED_TESTS.length} test(s) into "${getCollectionName()}".`);
}

main()
  .catch((err) => {
    console.error(`\nseedTests failed: ${err instanceof Error ? err.message : err}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeClient();
  });
